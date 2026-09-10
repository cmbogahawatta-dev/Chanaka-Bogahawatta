import React from 'react';
import {
  FileEdit,
  Globe,
  RefreshCw,
  CheckCircle2,
  Lock,
  Stamp,
  Archive,
  Send,
  ArrowRight
} from 'lucide-react';
import { LetterStatus, Letter } from '../../types/correspondenceTypes';

interface CorrespondenceWorkflowBarProps {
  status?: LetterStatus;
  letter?: Letter;
  isLocked?: boolean;
  onSelectStep?: (stepName: string) => void;
  onAdvanceStatus?: (letterId: string, newStatus: any) => void;
}

interface WorkflowStep {
  id: string;
  stepNumber: number;
  label: string;
  statusMatch: LetterStatus[];
  description: string;
  icon: React.ElementType;
}

export const CorrespondenceWorkflowBar: React.FC<CorrespondenceWorkflowBarProps> = ({
  status: propStatus,
  letter,
  isLocked,
  onSelectStep,
  onAdvanceStatus
}) => {
  const status = letter?.status || propStatus || 'Draft';
  const steps: WorkflowStep[] = [
    {
      id: 'DRAFT',
      stepNumber: 1,
      label: 'DRAFT',
      statusMatch: ['Draft'],
      description: 'Prepare initial draft',
      icon: FileEdit
    },
    {
      id: 'EDITING',
      stepNumber: 2,
      label: 'EDITING',
      statusMatch: ['External Editing'],
      description: 'Word / Google Docs editing',
      icon: Globe
    },
    {
      id: 'REVIEW',
      stepNumber: 3,
      label: 'REVIEW',
      statusMatch: ['Submitted for Review', 'Review', 'Revision Required', 'Final Review'],
      description: 'Import & compare revisions',
      icon: RefreshCw
    },
    {
      id: 'FINAL',
      stepNumber: 4,
      label: 'FINAL',
      statusMatch: ['Finalized'],
      description: 'Locked controlled final document',
      icon: Lock
    },
    {
      id: 'APPROVAL',
      stepNumber: 5,
      label: 'APPROVAL',
      statusMatch: ['Pending Approval', 'Approved'],
      description: 'Multi-officer signoff sequence',
      icon: Stamp
    },
    {
      id: 'ISSUED',
      stepNumber: 6,
      label: 'ISSUED',
      statusMatch: ['Issued', 'Archived'],
      description: 'Officially dispatched & archived',
      icon: Send
    }
  ];

  // Determine current active step index
  let activeIndex = steps.findIndex(s => s.statusMatch.includes(status));
  if (activeIndex === -1) {
    if (isLocked) activeIndex = 3;
    else activeIndex = 0;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Document Control Pipeline
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
            Current Status: {status}
          </span>
          {isLocked && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
              <Lock className="w-2.5 h-2.5" />
              Locked Content
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Step {activeIndex + 1} of {steps.length}: <span className="text-slate-200 font-semibold">{steps[activeIndex]?.description}</span>
        </div>
      </div>

      {/* Pipeline Track */}
      <div className="grid grid-cols-6 gap-1.5 pt-1">
        {steps.map((step, idx) => {
          const isPassed = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`relative flex flex-col items-center p-2 rounded-lg border transition-all text-center ${
                isCurrent
                  ? 'bg-purple-950/50 border-purple-500/80 shadow-xs shadow-purple-500/10'
                  : isPassed
                  ? 'bg-emerald-950/30 border-emerald-700/50'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <StepIcon
                    className={`w-4 h-4 ${
                      isCurrent ? 'text-purple-400 animate-pulse' : 'text-slate-500'
                    }`}
                  />
                )}
              </div>

              <div
                className={`text-[10px] font-black uppercase tracking-wider ${
                  isCurrent ? 'text-purple-200' : isPassed ? 'text-emerald-300' : 'text-slate-400'
                }`}
              >
                {step.label}
              </div>

              <div className="text-[9px] text-slate-400 truncate max-w-full mt-0.5">
                {step.description}
              </div>

              {idx < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
