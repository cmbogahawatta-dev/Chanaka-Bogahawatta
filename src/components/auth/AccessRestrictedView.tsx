import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEnterprise } from '../../context/EnterpriseContext';

interface AccessRestrictedViewProps {
  moduleName?: string;
  requiredPermission?: string;
  onGoDashboard?: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  moduleName = 'This Module',
  requiredPermission,
  onGoDashboard
}) => {
  const { currentUser } = useAuth();
  const { setCurrentModule } = useEnterprise();

  const handleReturn = () => {
    if (onGoDashboard) {
      onGoDashboard();
    } else {
      setCurrentModule('overview');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
            Access Authorization Denied
          </span>
          <h2 className="text-xl font-black text-slate-100">ACCESS RESTRICTED</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            You do not have permission to access <strong className="text-slate-200">{moduleName}</strong>.
            This area is restricted to authorized personnel in accordance with company policy.
          </p>
        </div>

        {currentUser && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>Logged In Employee:</span>
              <span className="font-bold text-slate-200">{currentUser.fullName} ({currentUser.employeeId})</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>Position / Department:</span>
              <span className="font-bold text-slate-200">{currentUser.position} • {currentUser.department}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Assigned Role:</span>
              <span className="font-mono text-amber-400 font-bold">{currentUser.role}</span>
            </div>
            {requiredPermission && (
              <div className="flex items-center justify-between text-slate-400 pt-1">
                <span>Required Permission:</span>
                <code className="px-1.5 py-0.5 rounded bg-slate-900 text-rose-300 font-mono text-[10px] border border-slate-800">
                  {requiredPermission}
                </code>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Permitted Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
