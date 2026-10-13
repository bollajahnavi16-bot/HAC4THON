import React from 'react';
import {
  Radar,
  Search,
  Compass,
  Zap,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  PauseCircle,
} from 'lucide-react';

const AGENT_ICONS = [Radar, Search, Compass, Zap, ShieldCheck, FileText];

export const WorkflowTimeline = ({ steps = [], currentStepIndex = 0, onSelectStep, selectedStepIndex }) => {
  return (
    <div className="w-full overflow-x-auto py-4 px-2">
      <div className="flex items-center justify-between min-w-[750px] relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-800 -z-0"></div>

        {steps.map((step, idx) => {
          const Icon = AGENT_ICONS[idx] || Radar;
          const isSelected = selectedStepIndex === idx;
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in_progress';
          const isWaitingApproval = step.status === 'waiting_approval';
          const isFailed = step.status === 'failed';
          const isStopped = step.status === 'stopped';

          let stateStyle = 'bg-navy-900 border-slate-700 text-slate-500';
          let statusBadge = <span className="text-[10px] text-slate-500 font-mono">Pending</span>;

          if (isCompleted) {
            stateStyle = 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/40';
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            );
          } else if (isInProgress) {
            stateStyle = 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-glow-cyan animate-pulse';
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span> Active
              </span>
            );
          } else if (isWaitingApproval) {
            stateStyle = 'bg-amber-950 border-amber-400 text-amber-300 shadow-amber-950/50 animate-bounce';
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-amber-300 font-mono font-bold">
                <PauseCircle className="w-3 h-3" /> Gate
              </span>
            );
          } else if (isFailed || isStopped) {
            stateStyle = 'bg-rose-950 border-rose-500 text-rose-300';
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-rose-300 font-mono">
                <AlertCircle className="w-3 h-3" /> {isStopped ? 'Halted' : 'Failed'}
              </span>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectStep(idx)}
              className={`relative z-10 flex flex-col items-center group focus:outline-none transition-transform ${
                isSelected ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              {/* Node Icon Circle */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${stateStyle} ${
                  isSelected ? 'ring-4 ring-cyan-500/30' : ''
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Step Index Pill */}
              <div className="mt-2 text-center">
                <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Step {idx + 1}
                </p>
                <h4 className="text-xs font-bold text-white max-w-[110px] truncate group-hover:text-cyan-300 transition-colors">
                  {step.agentName.replace(' Agent', '')}
                </h4>
                <div className="mt-0.5 flex justify-center">{statusBadge}</div>
                {step.durationMs > 0 && (
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    {Math.round(step.durationMs)}ms
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
