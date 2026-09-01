import React from 'react';
import {
  Wifi,
  Database,
  Truck,
  Wallet,
  CreditCard,
  Users,
  Clock,
  Sparkles,
  Command,
  Layers,
  Building
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { usePRV } from '../../context/PRVContext';
import { useStaff } from '../../context/StaffContext';

interface EnterpriseSystemStatusBarProps {
  selectedProjectFilter: string;
}

export const EnterpriseSystemStatusBar: React.FC<EnterpriseSystemStatusBarProps> = ({
  selectedProjectFilter
}) => {
  const { syncStatus, lastSyncTime } = useEnterprise();
  const { kpiMetrics } = usePettyCash();
  const { vehicles = [] } = useFleet();
  const { paymentRequests = [] } = usePRV();
  const { staffMembers = [] } = useStaff();

  const activeVehiclesCount = (vehicles || []).filter(v => v.status === 'Active').length;
  const activeStaffCount = (staffMembers || []).filter(s => s.status === 'Active').length;
  const pendingPRVsCount = (paymentRequests || []).filter(
    p => p.status === 'SUBMITTED' || p.status === 'ACCOUNTS_L1_APPROVED' || p.status === 'ACCOUNTS_L2_APPROVED' || p.status === 'PAYMENT_PROOF_PENDING'
  ).length;

  const totalPettyCash = kpiMetrics?.totalPettyCashInHand || 0;

  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800/90 select-none flex items-center justify-between px-3 text-[11px] text-slate-400 font-mono z-30 shrink-0">
      {/* LEFT: System Health & Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300 text-[10px]">SYSTEM ONLINE</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-slate-500">
          <span>|</span>
          <Building className="w-3 h-3 text-purple-400" />
          <span className="text-slate-300 font-medium text-[10px]">
            {selectedProjectFilter === 'ALL' ? 'Multi-Project Consolidated' : selectedProjectFilter}
          </span>
        </div>
      </div>

      {/* CENTER: Live ERP Metrics Telemetry Ribbon */}
      <div className="hidden md:flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1 text-slate-300">
          <Truck className="w-3 h-3 text-blue-400" />
          <span>Fleet: <strong>{activeVehiclesCount}/{(vehicles || []).length}</strong> Active</span>
        </div>

        <div className="flex items-center gap-1 text-slate-300">
          <Wallet className="w-3 h-3 text-emerald-400" />
          <span>Petty Cash: <strong>LKR {(totalPettyCash / 1000000).toFixed(2)}M</strong></span>
        </div>

        <div className="flex items-center gap-1 text-slate-300">
          <CreditCard className="w-3 h-3 text-rose-400" />
          <span>PRVs: <strong className={pendingPRVsCount > 0 ? 'text-rose-400 font-bold' : ''}>{pendingPRVsCount}</strong> Pending</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-slate-300">
          <Users className="w-3 h-3 text-cyan-400" />
          <span>Staff: <strong>{activeStaffCount}</strong> Active</span>
        </div>
      </div>

      {/* RIGHT: Sync Timestamp, Shortcuts & Build */}
      <div className="flex items-center gap-3 text-[10px]">
        <div className="hidden sm:flex items-center gap-1 text-slate-500">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Sync: {lastSyncTime || 'Just now'}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-slate-500">
          <span className="bg-slate-900 border border-slate-800 px-1 rounded text-[9px]">⌘K</span>
          <span>Command</span>
        </div>

        <span className="text-slate-600">v2026.9</span>
      </div>
    </footer>
  );
};
