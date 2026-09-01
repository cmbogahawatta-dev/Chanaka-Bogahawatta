import React, { useState } from 'react';
import {
  GitFork,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  X,
  FileCheck2,
  UserCheck
} from 'lucide-react';
import { useApprovalWorkflow } from '../../context/ApprovalWorkflowContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { ApprovalWorkflow, ApprovalLevelType } from '../../types/approvalWorkflowTypes';

export const ApprovalWorkflowsView: React.FC = () => {
  const { workflows, createWorkflow, updateWorkflow, deleteWorkflow } = useApprovalWorkflow();
  const { currentRole } = useEnterprise();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];
  const isHRorAdmin = currentRole === 'ADMIN' || currentRole === 'HR' || currentRole === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <GitFork className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Dynamic Approval Workflows</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-tier authorization chains for Leave Applications, Payroll Cycles, and Attendance Corrections.
          </p>
        </div>

        {isHRorAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              Enterprise Governance Active
            </span>
          </div>
        )}
      </div>

      {/* Workflow Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {workflows.map(wf => (
          <button
            key={wf.id}
            onClick={() => setSelectedWorkflowId(wf.id)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 shrink-0 border ${
              selectedWorkflow?.id === wf.id
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-xs'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{wf.name}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
              {wf.appliesTo}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Workflow Detailed Visualizer */}
      {selectedWorkflow && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{selectedWorkflow.name}</h3>
                {selectedWorkflow.isDefault && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[11px] font-semibold border border-blue-500/30">
                    Default Scheme
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedWorkflow.description}</p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Applies to: <span className="text-purple-400 font-bold">{selectedWorkflow.appliesTo}</span>
            </div>
          </div>

          {/* Stepped Process Trail */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Step-by-Step Multi-Level Authorization Sequence
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {selectedWorkflow.levels
                .slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((lvl, index) => {
                  const isLast = index === selectedWorkflow.levels.length - 1;

                  return (
                    <div
                      key={lvl.id}
                      className="relative bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-xs">
                          {lvl.sequence}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {lvl.mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-100">{lvl.title || lvl.levelType}</div>
                        <div className="text-[11px] text-purple-400 font-mono mt-0.5">
                          Type: {lvl.levelType}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                        {lvl.levelType === 'COVER_UP' && 'Requires nominated employee to accept handover duties first.'}
                        {lvl.levelType === 'IMMEDIATE_SUPERVISOR' && 'Dynamically resolves to employee’s site supervisor from active project allocation.'}
                        {lvl.levelType === 'PROJECT_MANAGER' && 'Resident Project Manager assigned to the construction site.'}
                        {lvl.levelType === 'HR' && 'Human Resources compliance & entitlement validation.'}
                        {lvl.levelType === 'FINANCE' && 'Accounts department ledger verification.'}
                        {lvl.levelType === 'OWNER' && 'Managing Director / Executive Owner final sanction.'}
                        {lvl.levelType === 'DEPARTMENT_HEAD' && 'Head of Engineering / Fleet / Operations.'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Workflow Principles Callout */}
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-xs text-slate-300 space-y-1">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Dynamic Resolution Policy
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Workflow steps never hardcode employee names. When an application is created, the system inspects the employee's active <strong>Project Allocation</strong> at that date and resolves the exact Immediate Supervisor, PM, and HR responsible officer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
