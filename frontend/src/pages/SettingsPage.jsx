import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { Loader } from '../components/common/Loader';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Server,
  Database,
  Cpu,
  ShieldAlert,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form states
  const [autoApprove, setAutoApprove] = useState(true);
  const [threshold, setThreshold] = useState(60);
  const [latency, setLatency] = useState(400);

  const { addToast, refreshBadges } = useApp();

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      if (res.data.success) {
        setData(res.data.data);
        const cfg = res.data.data.config || {};
        setAutoApprove(cfg.autoApproveLowRisk ?? true);
        setThreshold(cfg.riskApprovalThreshold ?? 60);
        setLatency(cfg.simulatedLatencyMs ?? 400);
      }
    } catch (err) {
      addToast({
        title: 'Error loading settings',
        message: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsAPI.updateSettings({
        autoApproveLowRisk: autoApprove,
        riskApprovalThreshold: threshold,
        simulatedLatencyMs: latency,
      });

      if (res.data.success) {
        addToast({
          title: 'Configuration Saved',
          message: 'System governance thresholds updated',
          type: 'success',
        });
        loadSettings();
      }
    } catch (err) {
      addToast({
        title: 'Save Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoSeed = async () => {
    if (!window.confirm('Are you sure you want to re-seed and reset the demo dataset to initial demo incidents?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await settingsAPI.resetSeed();
      if (res.data.success) {
        addToast({
          title: 'Demo Data Reset',
          message: res.data.message,
          type: 'success',
        });
        refreshBadges();
        loadSettings();
      }
    } catch (err) {
      addToast({
        title: 'Reset Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <Loader message="Probing infrastructure health status..." />;
  }

  const health = data?.systemHealth || {};

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Platform Settings & System Health</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Infrastructure diagnostics, Gemini AI reasoning status, and operational approval policies
        </p>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Backend Server */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Server className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              {health.server || 'ONLINE'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Express Backend</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Node.js {health.nodeVersion} • Uptime {health.uptimeSeconds}s
            </p>
          </div>
        </div>

        {/* Card 2: MongoDB */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              {health.database?.status || 'CONNECTED'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">MongoDB Persistence</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
              {health.database?.name} ({health.database?.host})
            </p>
          </div>
        </div>

        {/* Card 3: Gemini AI Agent Brain */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                health.geminiAI?.configured
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {health.geminiAI?.configured ? 'API ACTIVE' : 'FALLBACK READY'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Gemini Reasoning Engine</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {health.geminiAI?.modeDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="p-6 rounded-3xl bg-navy-900/80 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white">
            Operational Governance & Threshold Policies
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Configure automated execution gates and human-in-the-loop policies
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs font-sans">
          {/* Toggle: Auto-approve low risk */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-navy-950 border border-slate-800">
            <div>
              <h4 className="font-bold text-white">
                Auto-Authorize Low Blast-Radius Remediations
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Automatically execute safe customer notifications and internal status synchronizations without manual operator intervention.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Slider: Risk Score Approval Threshold */}
          <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">Risk Score Human Gate Threshold</h4>
                <p className="text-slate-400 text-[11px]">
                  Actions evaluated with risk score ≥ this threshold strictly pause for human approval.
                </p>
              </div>
              <span className="font-mono text-base font-black text-amber-400 bg-navy-900 px-3 py-1 rounded-xl border border-amber-500/30">
                {threshold}/100
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Slider: Simulated Business Latency */}
          <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">Simulated Business Action Latency</h4>
                <p className="text-slate-400 text-[11px]">
                  Fidelity delay (ms) for external carrier API, supplier PO, and payment gateway calls.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-300 bg-navy-900 px-2.5 py-1 rounded-xl border border-slate-700">
                {latency}ms
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-xs shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reset Demo Data Danger Card */}
      <div className="p-6 rounded-3xl bg-navy-900/60 border border-rose-500/30 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Reset Operational Demo Dataset</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Resets all 3 business scenarios (delayed order, inventory shortage, payment failure), orders, inventory items, and ledger to pristine demo states. Ideal for live evaluation replays!
            </p>
          </div>
          <button
            onClick={handleResetDemoSeed}
            disabled={resetting}
            className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Re-seed Demo Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
