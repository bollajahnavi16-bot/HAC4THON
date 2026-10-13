import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsAPI, incidentAPI } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Loader } from '../components/common/Loader';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  ShoppingBag,
  Package,
  CreditCard,
  Scan,
} from 'lucide-react';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState(null);
  const navigate = useNavigate();
  const { addToast, refreshBadges } = useApp();

  const loadDashboard = async () => {
    try {
      const [metricRes, incRes] = await Promise.all([
        metricsAPI.getDashboard(),
        incidentAPI.getAll(),
      ]);

      if (metricRes.data.success) {
        setData(metricRes.data.data);
      }
      if (incRes.data.success) {
        setIncidents(incRes.data.data.slice(0, 5)); // Top 5
      }
    } catch (err) {
      addToast({
        title: 'Dashboard Sync Error',
        message: 'Failed to synchronize live operational metrics',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunchWorkflow = async (incidentId) => {
    setTriggeringId(incidentId);
    try {
      const res = await incidentAPI.triggerWorkflow(incidentId);
      if (res.data.success) {
        addToast({
          title: 'Autonomous Workflow Dispatched',
          message: '6-Agent recovery sequence active',
          type: 'success',
        });
        refreshBadges();
        navigate(`/workflow?runId=${res.data.workflowRunId}`);
      }
    } catch (err) {
      addToast({
        title: 'Workflow Dispatch Failed',
        message: err.response?.data?.error || 'Unable to start agent workflow',
        type: 'error',
      });
    } finally {
      setTriggeringId(null);
    }
  };

  if (loading) {
    return <Loader message="Compiling executive business intelligence telemetry..." />;
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-800 shadow-glow-card relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              MISSION CONTROL
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Operations Feed
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
            Autonomous Business Recovery
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            AgentOps AI continuously detects operational bottlenecks, formulates recovery plans, enforces security gates, and verifies post-incident resolution.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => {
              setLoading(true);
              loadDashboard();
            }}
            className="p-3 rounded-2xl bg-navy-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh Metrics</span>
          </button>
          <button
            onClick={() => navigate('/incidents')}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-glow-cyan text-xs font-bold transition-all flex items-center gap-2"
          >
            <span>Investigate Incidents</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Incidents"
          value={kpis.activeIncidents ?? 0}
          subtitle={`${kpis.totalIncidents ?? 0} total registered incidents`}
          icon={AlertTriangle}
          color={kpis.activeIncidents > 0 ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Autonomous Recovery"
          value={`${kpis.recoverySuccessRate ?? 0}%`}
          subtitle="Resolved vs closed incidents"
          icon={CheckCircle2}
          color="cyan"
          trend="↑ 99.4% SLA adherence"
        />
        <MetricCard
          title="Mean Time To Recover"
          value={`${kpis.avgMTTRSeconds ?? 0}s`}
          subtitle="Autonomous agent MTTR"
          icon={Clock}
          color="violet"
          trend="↓ 94% faster than manual ops"
        />
        <MetricCard
          title="Human Approvals Queue"
          value={kpis.pendingApprovalsCount ?? 0}
          subtitle="Consequential actions awaiting review"
          icon={ShieldAlert}
          color={kpis.pendingApprovalsCount > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* 3 Core Demo Scenarios Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-slate-400">
            Initial Demo Operational Scenarios
          </h2>
          <span className="text-xs text-cyan-400 font-mono">3 Specialized Scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scenario 1: Delayed Orders */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  E-Commerce
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Delayed Orders Remediation
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Carrier hub congestion detection, automated Priority Air re-routing, and VIP customer goodwill credit issuance.
              </p>
            </div>
            <button
              onClick={() => navigate('/incidents?scenario=delayed_order')}
              className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-between"
            >
              <span>Explore Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario 2: Inventory Shortages */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-violet-500/30 hover:border-violet-400 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                  Supply Chain
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                Inventory Shortages
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Stockout burn-rate prediction, multi-warehouse stock reallocation, and expedited supplier emergency PO creation.
              </p>
            </div>
            <button
              onClick={() => navigate('/incidents?scenario=inventory_shortage')}
              className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center justify-between"
            >
              <span>Explore Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario 3: Payment Failures */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-rose-500/30 hover:border-rose-400 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                  FinTech
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                Payment Failures
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Gateway timeout diagnostics, secondary failover gateway rerouting, and fraud quarantine false-positive unblocking.
              </p>
            </div>
            <button
              onClick={() => navigate('/incidents?scenario=payment_failure')}
              className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center justify-between"
            >
              <span>Explore Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Incidents + Live Agent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-navy-900/80 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Active Operational Incidents</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Incidents pending or undergoing multi-agent autonomous recovery
              </p>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="pb-3 font-semibold">Incident</th>
                  <th className="pb-3 font-semibold">Scenario</th>
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500 italic">
                      Zero active operational anomalies. All systems healthy.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc._id} className="hover:bg-navy-850/60 transition-colors">
                      <td className="py-3.5 pr-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 block">
                          {inc.incidentId}
                        </span>
                        <span className="text-slate-200 font-medium line-clamp-1">
                          {inc.title}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <StatusBadge status={inc.scenario} type="scenario" />
                      </td>
                      <td className="py-3.5 pr-2">
                        <StatusBadge status={inc.severity} type="severity" />
                      </td>
                      <td className="py-3.5 pr-2">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="py-3.5 text-right">
                        {inc.status === 'open' ? (
                          <button
                            onClick={() => handleLaunchWorkflow(inc._id)}
                            disabled={triggeringId === inc._id}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs shadow-glow-cyan transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{triggeringId === inc._id ? 'Starting...' : 'Run Agents'}</span>
                          </button>
                        ) : inc.activeWorkflowRunId ? (
                          <button
                            onClick={() =>
                              navigate(
                                `/workflow?runId=${
                                  typeof inc.activeWorkflowRunId === 'object'
                                    ? inc.activeWorkflowRunId._id
                                    : inc.activeWorkflowRunId
                                }`
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-navy-950 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/incidents/${inc._id}`)}
                            className="px-3 py-1.5 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-all ml-auto"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit & Agent Activity Feed (1 col) */}
        <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Agent Activity Feed</span>
            </h3>
            <button
              onClick={() => navigate('/audit')}
              className="text-xs font-mono text-cyan-400 hover:underline"
            >
              Full Log
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[320px]">
            {data?.recentActivity?.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">
                No recent activity recorded.
              </p>
            ) : (
              data?.recentActivity?.map((act) => (
                <div
                  key={act._id}
                  className="p-3 rounded-xl bg-navy-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                      {act.actorName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(act.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-1 capitalize">
                    {act.actionType.replace(/_/g, ' ')}
                  </p>
                  {act.incidentCode && (
                    <span className="mt-1 inline-block text-[10px] font-mono text-violet-300 bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-500/20">
                      {act.incidentCode}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
