import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Loader } from '../components/common/Loader';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Zap,
  Clock,
  ShieldAlert,
  Server,
  Package,
  CreditCard,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export const IncidentDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useApp();

  const loadDetail = async () => {
    try {
      const res = await incidentAPI.getById(id);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      addToast({
        title: 'Error loading incident',
        message: err.response?.data?.error || 'Incident not found',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await incidentAPI.triggerWorkflow(id);
      if (res.data.success) {
        addToast({
          title: 'Recovery Pipeline Initialized',
          message: '6-Agent Autonomous Workflow active',
          type: 'success',
        });
        navigate(`/workflow?runId=${res.data.workflowRunId}`);
      }
    } catch (err) {
      addToast({
        title: 'Workflow Trigger Failed',
        message: err.response?.data?.error || 'Unable to launch workflow',
        type: 'error',
      });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return <Loader message="Retrieving incident operational telemetry..." />;
  }

  if (!data?.incident) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Incident record not found.</p>
        <button
          onClick={() => navigate('/incidents')}
          className="mt-4 px-4 py-2 rounded-xl bg-navy-900 border border-slate-700 text-xs text-white"
        >
          Return to Incidents Explorer
        </button>
      </div>
    );
  }

  const { incident, entityData } = data;

  return (
    <div className="space-y-6">
      {/* Back and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/incidents')}
          className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents Explorer</span>
        </button>

        <div className="flex items-center gap-3">
          {incident.status === 'open' ? (
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-xs shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{triggering ? 'Dispatching Agents...' : 'Run Autonomous Recovery'}</span>
            </button>
          ) : incident.activeWorkflowRunId ? (
            <button
              onClick={() =>
                navigate(
                  `/workflow?runId=${
                    typeof incident.activeWorkflowRunId === 'object'
                      ? incident.activeWorkflowRunId._id
                      : incident.activeWorkflowRunId
                  }`
                )
              }
              className="px-5 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-glow-cyan flex items-center gap-2 transition-all"
            >
              <span>View Agent Workflow Visualizer</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Incident Overview Card */}
      <div className="p-6 rounded-3xl bg-navy-900/80 border border-slate-800 space-y-4 shadow-glow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/30">
              {incident.incidentId}
            </span>
            <StatusBadge status={incident.scenario} type="scenario" />
            <StatusBadge status={incident.severity} type="severity" />
            <StatusBadge status={incident.status} />
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Blast Radius: <strong className="text-white uppercase">{incident.blastRadius}</strong></span>
            <span>Risk Score: <strong className="text-amber-400">{incident.riskScore}/100</strong></span>
          </div>
        </div>

        <h1 className="text-xl lg:text-2xl font-extrabold text-white">
          {incident.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">
          {incident.summary || 'Operational issue flagged by telemetry.'}
        </p>

        {incident.rootCause && (
          <div className="p-4 rounded-2xl bg-navy-950 border border-cyan-500/30">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Investigation Agent Root Cause Analysis:
            </h4>
            <p className="mt-1 text-xs text-slate-200 font-sans">
              {incident.rootCause}
            </p>
          </div>
        )}
      </div>

      {/* Affected Entity Telemetry Card */}
      <div className="p-6 rounded-3xl bg-navy-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          {incident.affectedEntityType === 'Order' && <Server className="w-5 h-5 text-cyan-400" />}
          {incident.affectedEntityType === 'InventoryItem' && <Package className="w-5 h-5 text-violet-400" />}
          {incident.affectedEntityType === 'PaymentTransaction' && <CreditCard className="w-5 h-5 text-rose-400" />}
          <h3 className="text-base font-extrabold text-white">
            Operational Telemetry: [{incident.affectedEntityType}] {incident.affectedEntityId}
          </h3>
        </div>

        {entityData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {Object.entries(entityData).map(([key, val]) => {
              if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return null;
              return (
                <div key={key} className="p-3 rounded-xl bg-navy-950 border border-slate-800/80">
                  <p className="text-[10px] font-mono uppercase text-slate-400">{key}</p>
                  <p className="mt-1 font-semibold text-white break-words">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No direct entity telemetry attached.</p>
        )}
      </div>
    </div>
  );
};
