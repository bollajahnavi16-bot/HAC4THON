import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { approvalAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useApp } from '../context/AppContext';
import {
  CheckSquare,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const ApprovalQueuePage = () => {
  const [approvals, setApprovals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);
  const [notes, setNotes] = useState({});

  const navigate = useNavigate();
  const { addToast, refreshBadges } = useApp();

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await approvalAPI.getAll({ status: statusFilter });
      if (res.data.success) {
        setApprovals(res.data.data);
      }
    } catch (err) {
      addToast({
        title: 'Error loading approval queue',
        message: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [statusFilter]);

  const handleDecision = async (id, approved) => {
    setDecidingId(id);
    const decisionNote = notes[id] || (approved ? 'Authorized by operator' : 'Rejected by operator');

    try {
      const res = await approvalAPI.decide(id, {
        approved,
        decisionNotes: decisionNote,
      });

      if (res.data.success) {
        addToast({
          title: approved ? 'Action Authorized' : 'Action Rejected',
          message: res.data.message,
          type: approved ? 'success' : 'warning',
        });
        refreshBadges();
        loadApprovals();
      }
    } catch (err) {
      addToast({
        title: 'Decision Error',
        message: err.response?.data?.error || err.message,
        type: 'error',
      });
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            <span>Human-in-the-Loop Authorization Queue</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Security governance gates for consequential operational mutations with high blast radius
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-900 border border-slate-800">
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List */}
      {loading ? (
        <Loader message="Querying governance approval queue..." />
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={statusFilter === 'pending' ? 'No Actions Pending Approval' : 'No Records Found'}
          description={
            statusFilter === 'pending'
              ? 'All agent actions are currently authorized or within auto-approval risk thresholds.'
              : 'Zero records found matching current status filter.'
          }
          actionLabel="View Incidents"
          onAction={() => navigate('/incidents')}
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => {
            const isPending = appr.status === 'pending';
            return (
              <div
                key={appr._id}
                className={`p-6 rounded-3xl border transition-all ${
                  isPending
                    ? 'bg-navy-900/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
                    : 'bg-navy-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/30">
                      {appr.incidentCode}
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      Action #{appr.actionId}
                    </span>
                    <StatusBadge status={appr.blastRadius} type="blast_radius" />
                    <StatusBadge status={appr.status} />
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>Risk Score: <strong className="text-amber-400">{appr.riskScore}/100</strong></span>
                    <span>Requested: <strong>{new Date(appr.requestedAt).toLocaleTimeString()}</strong></span>
                  </div>
                </div>

                {/* Details Body */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 cols: Action Details */}
                  <div className="lg:col-span-2 space-y-3">
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        {appr.actionName}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Target: {appr.targetEntity} • Action Type: [{appr.actionType}]
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-navy-950 border border-slate-800">
                      <p className="text-[10px] font-mono uppercase text-slate-400">
                        Planning Agent Rationale:
                      </p>
                      <p className="text-xs text-slate-200 mt-1 italic">
                        "{appr.reason}"
                      </p>
                    </div>

                    {appr.parameters && (
                      <div>
                        <p className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Execution Parameters:
                        </p>
                        <pre className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                          {JSON.stringify(appr.parameters, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Right 1 col: Decision Gate Controls */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-4">
                    {isPending ? (
                      <>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                            Operator Decision Note
                          </label>
                          <textarea
                            rows="2"
                            placeholder="Add reason for approval or rejection..."
                            value={notes[appr._id] || ''}
                            onChange={(e) =>
                              setNotes({ ...notes, [appr._id]: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl bg-navy-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-sans"
                          ></textarea>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleDecision(appr._id, true)}
                            disabled={decidingId === appr._id}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Authorize & Resume Pipeline</span>
                          </button>

                          <button
                            onClick={() => handleDecision(appr._id, false)}
                            disabled={decidingId === appr._id}
                            className="w-full py-2 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject & Abort Action</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono uppercase text-slate-400">
                          Decision Audit:
                        </p>
                        <p className="text-xs font-semibold text-white">
                          Decided by: {appr.decidedBy || 'Operator'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Timestamp: {new Date(appr.decidedAt).toLocaleString()}
                        </p>
                        {appr.decisionNotes && (
                          <p className="text-xs text-slate-300 italic bg-navy-900 p-2 rounded border border-slate-800">
                            "{appr.decisionNotes}"
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const runId = appr.workflowRunId?._id || appr.workflowRunId;
                        navigate(`/workflow?runId=${runId}`);
                      }}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center justify-center gap-1 mt-auto"
                    >
                      <span>Inspect in Visualizer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
