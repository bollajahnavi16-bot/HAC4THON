import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { workflowAPI, approvalAPI } from '../services/api';
import { WorkflowTimeline } from '../components/workflow/WorkflowTimeline';
import { AgentStepCard } from '../components/workflow/AgentStepCard';
import { LiveTerminal } from '../components/workflow/LiveTerminal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Loader } from '../components/common/Loader';
import { useApp } from '../context/AppContext';
import {
  GitBranch,
  StopCircle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Loader2,
  ListChecks,
  ThumbsUp,
  XCircle,
} from 'lucide-react';

export const WorkflowVisualizerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const runIdParam = searchParams.get('runId');

  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(runIdParam || '');
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [userPinnedStep, setUserPinnedStep] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  // 'idle' | 'loading' | 'success' | 'error'
  const [approveState, setApproveState] = useState('idle');
  const [approveError, setApproveError] = useState('');

  const navigate = useNavigate();
  const { addToast, refreshBadges } = useApp();

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const loadWorkflowsList = async () => {
    try {
      const res = await workflowAPI.getAll();
      if (res.data.success && res.data.data.length > 0) {
        setWorkflows(res.data.data);
        if (!selectedWorkflowId) {
          setSelectedWorkflowId(res.data.data[0]._id);
          setSearchParams({ runId: res.data.data[0]._id });
        }
      }
    } catch (err) {
      console.error('[WorkflowViz] Failed to load workflows list:', err);
    }
  };

  const loadWorkflowDetails = useCallback(
    async (id, isBackgroundPoll = false) => {
      if (!id) return;
      try {
        const res = await workflowAPI.getById(id);
        if (res.data.success) {
          const wf = res.data.data;
          setCurrentWorkflow(wf);
          if (!userPinnedStep && (wf.status === 'running' || wf.status === 'paused_approval')) {
            setSelectedStepIndex(wf.currentStepIndex || 0);
          }
          // Clear approve feedback once workflow moves past paused state
          if (wf.status !== 'paused_approval') {
            setApproveState('idle');
            setApproveError('');
          }
        }
      } catch (err) {
        if (!isBackgroundPoll) {
          addToast({
            title: 'Error loading workflow',
            message: err.response?.data?.error || 'Workflow not found',
            type: 'error',
          });
        }
      } finally {
        if (!isBackgroundPoll) setLoading(false);
      }
    },
    [userPinnedStep, addToast]
  );

  useEffect(() => {
    loadWorkflowsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedWorkflowId) {
      setLoading(true);
      loadWorkflowDetails(selectedWorkflowId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkflowId]);

  // Background polling — only while workflow is active
  useEffect(() => {
    if (!selectedWorkflowId) return;
    const ACTIVE = new Set(['running', 'paused_approval']);
    const interval = setInterval(() => {
      if (currentWorkflow && ACTIVE.has(currentWorkflow.status)) {
        loadWorkflowDetails(selectedWorkflowId, true);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedWorkflowId, currentWorkflow?.status, loadWorkflowDetails]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleStopWorkflow = async () => {
    if (!selectedWorkflowId || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await workflowAPI.stop(selectedWorkflowId, 'Operator manual abort');
      if (res.data.success) {
        addToast({ title: 'Workflow Halted', message: 'Execution aborted safely by operator', type: 'warning' });
        loadWorkflowDetails(selectedWorkflowId);
      }
    } catch (err) {
      addToast({ title: 'Stop Failed', message: err.response?.data?.error || err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryWorkflow = async () => {
    if (!selectedWorkflowId || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await workflowAPI.retry(selectedWorkflowId);
      if (res.data.success) {
        setUserPinnedStep(false);
        addToast({ title: 'Workflow Resumed', message: 'Multi-agent pipeline re-engaged', type: 'success' });
        loadWorkflowDetails(selectedWorkflowId);
      }
    } catch (err) {
      addToast({ title: 'Retry Failed', message: err.response?.data?.error || err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickApprove = async () => {
    if (actionLoading || approveState === 'loading' || approveState === 'success') return;

    const rawId = currentWorkflow?.pendingApprovalId;
    if (!rawId) {
      addToast({ title: 'No Pending Approval', message: 'Workflow has no approval awaiting decision.', type: 'warning' });
      return;
    }
    // pendingApprovalId may be a populated object or a plain ObjectId string
    const approvalId = typeof rawId === 'object' && rawId !== null ? rawId._id : rawId;

    setApproveState('loading');
    setApproveError('');
    setActionLoading(true);
    try {
      const res = await approvalAPI.decide(approvalId, {
        approved: true,
        decisionNotes: 'Quick authorization from Visualizer Console',
      });
      if (res.data.success) {
        setApproveState('success');
        addToast({ title: '✅ Action Approved', message: 'Action Agent is resuming execution…', type: 'success' });
        refreshBadges();
        // Brief delay for backend state transition, then poll
        setTimeout(() => loadWorkflowDetails(selectedWorkflowId), 900);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Approval request failed';
      setApproveState('error');
      setApproveError(msg);
      addToast({ title: 'Approval Failed', message: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Derived State ─────────────────────────────────────────────────────────

  if (loading && !currentWorkflow) {
    return <Loader message="Initializing AgentOps Multi-Agent Visualizer…" />;
  }

  const allLogs = (currentWorkflow?.steps || []).flatMap((s) => s.logs || []);
  const selectedStep = currentWorkflow?.steps?.[selectedStepIndex] ?? currentWorkflow?.steps?.[0];

  // pendingApprovalId is populated — may have .status
  const pendingApproval = currentWorkflow?.pendingApprovalId;
  const approvalAlreadyDecided =
    pendingApproval &&
    typeof pendingApproval === 'object' &&
    pendingApproval.status &&
    pendingApproval.status !== 'pending';
  const canApprove =
    currentWorkflow?.status === 'paused_approval' &&
    !!pendingApproval &&
    !approvalAlreadyDecided;

  const approveButtonDisabled =
    actionLoading ||
    approveState === 'loading' ||
    approveState === 'success' ||
    !canApprove;

  return (
    <div className="space-y-6">
      {/* ── Header & Workflow Selector ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-cyan-400" />
            <span>Agent Workflow Visualizer</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Autonomous multi-agent pipeline: Monitor → Investigate → Plan → Action → Verify → Report
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            id="workflow-selector"
            value={selectedWorkflowId}
            onChange={(e) => {
              setSelectedWorkflowId(e.target.value);
              setUserPinnedStep(false);
              setApproveState('idle');
              setApproveError('');
              setSearchParams({ runId: e.target.value });
            }}
            className="px-3 py-2 rounded-xl bg-navy-900 border border-slate-700 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 max-w-xs truncate transition-all cursor-pointer"
          >
            {workflows.map((wf) => (
              <option key={wf._id} value={wf._id}>
                {wf.incidentCode} • {wf.scenario} ({wf.status})
              </option>
            ))}
          </select>

          {currentWorkflow?.status === 'running' && (
            <button
              id="btn-stop-workflow"
              onClick={handleStopWorkflow}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 active:scale-95 border border-rose-500/40 hover:border-rose-400/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StopCircle className="w-4 h-4" />
              <span>Stop Workflow</span>
            </button>
          )}

          {['stopped', 'failed'].includes(currentWorkflow?.status) && (
            <button
              id="btn-retry-workflow"
              onClick={handleRetryWorkflow}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 active:scale-95 border border-cyan-500/40 hover:border-cyan-400/70 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry / Resume</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Human Approval Alert Banner ────────────────────────────────────── */}
      {currentWorkflow?.status === 'paused_approval' && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/60 shadow-lg shadow-amber-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 mt-0.5 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Human Authorization Gate Triggered</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  ACTION PAUSED
                </span>
              </h3>
              <p className="mt-1 text-xs text-amber-200/90 max-w-2xl leading-relaxed">
                The Planning Agent formulated a consequential operational modification with high blast radius.
                Security policy requires verified human sign-off before Action Agent execution.
              </p>
              {/* Inline feedback */}
              {approveState === 'error' && approveError && (
                <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {approveError}
                </p>
              )}
              {approveState === 'success' && (
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Approved — Action Agent is resuming…
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Approval Queue Button */}
            <button
              id="btn-approval-queue"
              onClick={() => navigate('/approvals')}
              className="
                inline-flex items-center gap-2
                px-4 py-2.5 rounded-xl
                bg-navy-900/90 border border-amber-500/40
                text-amber-300 text-xs font-semibold
                hover:bg-slate-800 hover:border-amber-400/70 hover:text-amber-200
                active:bg-slate-900 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-amber-400/50
                transition-all duration-150 cursor-pointer select-none
              "
            >
              <ListChecks className="w-4 h-4" />
              <span>Approval Queue</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Approve & Resume Button */}
            <button
              id="btn-approve-resume"
              onClick={handleQuickApprove}
              disabled={approveButtonDisabled}
              title={!canApprove ? 'No pending approval — check queue' : 'Approve and resume execution'}
              className="
                inline-flex items-center gap-2
                px-5 py-2.5 rounded-xl
                bg-gradient-to-r from-amber-500 to-amber-600
                hover:from-amber-400 hover:to-amber-500
                active:from-amber-600 active:to-amber-700 active:scale-95
                text-navy-950 font-bold text-xs
                shadow-md shadow-amber-900/40
                focus:outline-none focus:ring-2 focus:ring-amber-300/60
                transition-all duration-150 cursor-pointer select-none
                disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
              "
            >
              {approveState === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Approving…</span>
                </>
              ) : approveState === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  <span>Approve &amp; Resume</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Workflow Metadata Bar ──────────────────────────────────────────── */}
      {currentWorkflow && (
        <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              {currentWorkflow.incidentCode}
            </span>
            <StatusBadge status={currentWorkflow.scenario} type="scenario" />
            <StatusBadge status={currentWorkflow.status} />
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Current Step: <strong>{(currentWorkflow.currentStepIndex ?? 0) + 1}/6</strong></span>
            <span>Started: <strong>{new Date(currentWorkflow.createdAt).toLocaleTimeString()}</strong></span>
            {currentWorkflow.finalReport?.recoveryDurationMs && (
              <span className="text-emerald-400">
                MTTR: <strong>{Math.round(currentWorkflow.finalReport.recoveryDurationMs / 1000)}s</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── 6-Agent Interactive Timeline ──────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-navy-900/80 border border-slate-800 shadow-glow-card">
        <WorkflowTimeline
          steps={currentWorkflow?.steps || []}
          currentStepIndex={currentWorkflow?.currentStepIndex || 0}
          onSelectStep={(idx) => {
            setUserPinnedStep(true);
            setSelectedStepIndex(idx);
          }}
          selectedStepIndex={selectedStepIndex}
        />
      </div>

      {/* ── Main Inspection Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgentStepCard step={selectedStep} stepIndex={selectedStepIndex} />
        <LiveTerminal logs={allLogs} title="Agent Execution Telemetry Stream" />
      </div>

      {/* ── Executive Report Card (completed only) ────────────────────────── */}
      {currentWorkflow?.finalReport && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 border border-emerald-500/40 shadow-glow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Executive Recovery Brief &amp; Compliance Record
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Autonomous Resolution Verified • Cryptographic Audit Ledger
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/30">
              RECOVERED IN {Math.round((currentWorkflow.finalReport.recoveryDurationMs || 0) / 1000)}s
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
              <h4 className="font-mono text-slate-400 uppercase text-[10px]">Executive Summary</h4>
              <p className="text-slate-200 leading-relaxed font-sans">
                {currentWorkflow.finalReport.executiveSummary}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
              <h4 className="font-mono text-slate-400 uppercase text-[10px]">Verification Assertions</h4>
              <p className="text-emerald-300 font-medium font-sans">
                {currentWorkflow.finalReport.verifiedOutcome}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800">
                <p className="font-mono text-[10px] text-slate-400">Audit Signature:</p>
                <p className="font-mono text-[10px] text-cyan-400 break-all">
                  {currentWorkflow.finalReport.complianceHash}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
