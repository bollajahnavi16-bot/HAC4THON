import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Code2, Check, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export const AgentStepCard = ({ step, stepIndex }) => {
  const [showJson, setShowJson] = useState(false);

  if (!step) return null;

  const output = step.outputPayload || {};

  return (
    <div className="rounded-2xl border border-slate-800 bg-navy-900/70 backdrop-blur-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-400">
            Agent Module {stepIndex + 1} of 6
          </span>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            {step.agentName}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={step.status} />
          {step.durationMs > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-navy-950 border border-slate-800 font-mono text-xs text-slate-300">
              ⏱ {Math.round(step.durationMs)}ms
            </span>
          )}
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showJson ? 'Rich View' : 'Raw JSON'}
          </button>
        </div>
      </div>

      {/* Raw JSON View */}
      {showJson ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-mono font-semibold text-slate-400 mb-1">OUTPUT PAYLOAD:</h4>
            <pre className="p-4 rounded-xl bg-navy-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-96">
              {JSON.stringify(output, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        /* Rich Domain View based on Agent Type */
        <div className="space-y-5">
          {/* 1. MONITOR AGENT */}
          {step.agentName.includes('Monitor') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Delayed Orders</p>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {output.healthOverview?.totalDelayedOrders ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Inventory Shortages</p>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {output.healthOverview?.totalInventoryDeficits ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Payment Failures</p>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {output.healthOverview?.totalPaymentFailures ?? 0}
                  </p>
                </div>
              </div>

              {output.anomalies && output.anomalies.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Detected Anomalies
                  </h4>
                  <div className="space-y-2">
                    {output.anomalies.map((anom, i) => (
                      <div key={i} className="p-3 rounded-xl bg-navy-950 border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white">{anom.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{anom.summary}</p>
                        </div>
                        <StatusBadge status={anom.severity} type="severity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. INVESTIGATION AGENT */}
          {step.agentName.includes('Investigation') && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-cyan-400 uppercase">
                    Root Cause Diagnosis
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                    Confidence: {output.confidenceScore || 90}%
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {output.primaryHypothesis || output.rootCauseCategory || 'Analyzing diagnostic data...'}
                </h4>
                {output.technicalDetails && (
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-navy-900/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                    {output.technicalDetails}
                  </p>
                )}
              </div>

              {output.evidence && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Key Evidentiary Facts
                  </h4>
                  <ul className="space-y-1.5">
                    {output.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-navy-950/60 p-2 rounded-lg border border-slate-800/60">
                        <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 3. PLANNING AGENT */}
          {step.agentName.includes('Planning') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Strategy Summary</p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {output.strategySummary || 'Formulating recovery plan'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Overall Risk Score</p>
                  <p className="text-lg font-mono font-black text-amber-400 mt-0.5">
                    {output.overallRiskScore || 50}/100
                  </p>
                </div>
              </div>

              {output.actions && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Allowlisted Recovery Actions
                  </h4>
                  <div className="space-y-2">
                    {output.actions.map((act, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          act.requiresApproval
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-navy-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-cyan-400 font-bold">{act.actionId}</span>
                            <h5 className="text-xs font-bold text-white">{act.name}</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 font-mono">
                            Target: {act.target} • Type: [{act.actionType}]
                          </p>
                          <p className="text-[11px] text-slate-300 mt-1 italic">{act.rationale}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={act.blastRadius} type="blast_radius" />
                          {act.requiresApproval ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                              Requires Approval
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                              Auto-Approved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. ACTION AGENT */}
          {step.agentName.includes('Action') && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                <p className="text-xs text-slate-400">
                  Actions executed strictly through backend allowlist runners with realistic business simulation.
                </p>
              </div>

              {output.actions && (
                <div className="space-y-2">
                  {output.actions.map((act, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-navy-950 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-white">{act.name}</h5>
                        <StatusBadge status={act.status} />
                      </div>
                      {act.result && (
                        <pre className="mt-2 p-2 rounded bg-navy-900 border border-slate-800/80 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                          {JSON.stringify(act.result, null, 2)}
                        </pre>
                      )}
                      {act.errorMessage && (
                        <p className="mt-2 text-xs text-rose-400 font-mono">
                          Error: {act.errorMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. VERIFICATION AGENT */}
          {step.agentName.includes('Verification') && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                output.verified ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Operational State Verification
                  </h4>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    Pass Rate: {output.verificationSuccessRate ?? 100}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">{output.summary}</p>
              </div>

              {output.checks && (
                <div className="space-y-2">
                  {output.checks.map((chk, i) => (
                    <div key={i} className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-start gap-2.5">
                      {chk.passed ? (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-white">{chk.assertion}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{chk.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. REPORTING AGENT */}
          {step.agentName.includes('Reporting') && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Executive Brief</p>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    {output.executiveSummary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Verified Outcome</p>
                  <p className="text-xs text-emerald-300 font-semibold mt-1">
                    {output.verifiedOutcome}
                  </p>
                </div>

                {output.complianceHash && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-400">Cryptographic Audit Hash:</span>
                    <span className="text-cyan-400 bg-navy-900 px-2 py-0.5 rounded border border-cyan-500/30">
                      {output.complianceHash}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
