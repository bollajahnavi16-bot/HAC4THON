import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { incidentAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Loader } from '../components/common/Loader';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Zap,
  ArrowRight,
  Scan,
  RefreshCw,
} from 'lucide-react';

export const IncidentsPage = () => {
  const [searchParams] = useSearchParams();
  const initialScenario = searchParams.get('scenario') || 'all';

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scenarioFilter, setScenarioFilter] = useState(initialScenario);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [triggeringId, setTriggeringId] = useState(null);

  // New Incident form state
  const [newTitle, setNewTitle] = useState('');
  const [newScenario, setNewScenario] = useState('delayed_order');
  const [newSeverity, setNewSeverity] = useState('high');
  const [newEntityId, setNewEntityId] = useState('ORD-9821');
  const [newEntityType, setNewEntityType] = useState('Order');
  const [newSummary, setNewSummary] = useState('');

  const navigate = useNavigate();
  const { addToast, refreshBadges } = useApp();

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await incidentAPI.getAll({
        scenario: scenarioFilter,
        severity: severityFilter,
        status: statusFilter,
        search: searchQuery,
      });
      if (res.data.success) {
        setIncidents(res.data.data);
      }
    } catch (err) {
      addToast({
        title: 'Error loading incidents',
        message: err.response?.data?.error || 'Unable to retrieve incident ledger',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [scenarioFilter, severityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await incidentAPI.scanAnomalies();
      if (res.data.success) {
        addToast({
          title: 'Monitor Scan Finished',
          message: res.data.message,
          type: res.data.newlyCreatedCount > 0 ? 'warning' : 'success',
        });
        refreshBadges();
        fetchIncidents();
      }
    } catch (err) {
      addToast({
        title: 'Scan Error',
        message: err.message,
        type: 'error',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleTriggerWorkflow = async (incidentId) => {
    setTriggeringId(incidentId);
    try {
      const res = await incidentAPI.triggerWorkflow(incidentId);
      if (res.data.success) {
        addToast({
          title: 'Recovery Workflow Started',
          message: 'Autonomous agent sequence running',
          type: 'success',
        });
        refreshBadges();
        navigate(`/workflow?runId=${res.data.workflowRunId}`);
      }
    } catch (err) {
      addToast({
        title: 'Workflow Dispatch Failed',
        message: err.response?.data?.error || 'Failed to start workflow',
        type: 'error',
      });
    } finally {
      setTriggeringId(null);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await incidentAPI.create({
        title: newTitle,
        scenario: newScenario,
        severity: newSeverity,
        affectedEntityId: newEntityId,
        affectedEntityType: newEntityType,
        summary: newSummary,
      });

      if (res.data.success) {
        addToast({
          title: 'Incident Registered',
          message: `Created ${res.data.data.incidentId}`,
          type: 'success',
        });
        setIsModalOpen(false);
        setNewTitle('');
        setNewSummary('');
        fetchIncidents();
      }
    } catch (err) {
      addToast({
        title: 'Creation Failed',
        message: err.response?.data?.error || 'Validation error',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-cyan-400" />
            <span>Incidents & Operations Explorer</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Audit and autonomously remediate operational disruptions across enterprise systems
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Scan className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Scan Anomalies'}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-glow-cyan flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Incident</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, ID, entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">All Scenarios</option>
            <option value="delayed_order">Delayed Orders</option>
            <option value="inventory_shortage">Inventory Shortages</option>
            <option value="payment_failure">Payment Failures</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="resolved">Resolved</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>
      </div>

      {/* Incidents Table / Cards */}
      {loading ? (
        <Loader message="Loading incident ledger..." />
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-navy-900/40 text-slate-400">
          <p className="text-sm font-semibold text-white">No incidents match current filter criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Adjust filters or click "Scan Anomalies" to re-check operational data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {incidents.map((inc) => (
            <div
              key={inc._id}
              className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    {inc.incidentId}
                  </span>
                  <StatusBadge status={inc.scenario} type="scenario" />
                  <StatusBadge status={inc.severity} type="severity" />
                  <StatusBadge status={inc.status} />
                  {inc.riskScore && (
                    <span className="font-mono text-[10px] text-amber-400 bg-navy-950 px-2 py-0.5 rounded border border-amber-500/20">
                      Risk: {inc.riskScore}/100
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white tracking-wide">
                  {inc.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-1">
                  {inc.summary || 'Operational anomaly flagged for autonomous investigation.'}
                </p>

                <p className="text-[11px] font-mono text-slate-500">
                  Affected Entity: [{inc.affectedEntityType}] {inc.affectedEntityId} • Registered:{' '}
                  {new Date(inc.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/incidents/${inc._id}`)}
                  className="px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Inspect Details
                </button>

                {inc.status === 'open' ? (
                  <button
                    onClick={() => handleTriggerWorkflow(inc._id)}
                    disabled={triggeringId === inc._id}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-xs shadow-glow-cyan transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{triggeringId === inc._id ? 'Launching...' : 'Run Recovery'}</span>
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
                    className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-glow-cyan transition-all flex items-center gap-1.5"
                  >
                    <span>View Visualizer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register Custom Incident */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Operational Incident"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-mono text-slate-300 uppercase mb-1">Incident Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. VIP Order Delivery Stalled: Hub Congestion"
              className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-300 uppercase mb-1">Scenario</label>
              <select
                value={newScenario}
                onChange={(e) => {
                  setNewScenario(e.target.value);
                  if (e.target.value === 'delayed_order') {
                    setNewEntityType('Order');
                    setNewEntityId('ORD-9821');
                  } else if (e.target.value === 'inventory_shortage') {
                    setNewEntityType('InventoryItem');
                    setNewEntityId('COMP-GPU-H100');
                  } else if (e.target.value === 'payment_failure') {
                    setNewEntityType('PaymentTransaction');
                    setNewEntityId('TX-PAY-7741');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white outline-none focus:border-cyan-400 text-xs"
              >
                <option value="delayed_order">Delayed Order</option>
                <option value="inventory_shortage">Inventory Shortage</option>
                <option value="payment_failure">Payment Failure</option>
                <option value="custom">Custom Incident</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-slate-300 uppercase mb-1">Severity</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white outline-none focus:border-cyan-400 text-xs"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-300 uppercase mb-1">Entity Type</label>
              <select
                value={newEntityType}
                onChange={(e) => setNewEntityType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white outline-none focus:border-cyan-400 text-xs"
              >
                <option value="Order">Order</option>
                <option value="InventoryItem">InventoryItem</option>
                <option value="PaymentTransaction">PaymentTransaction</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-slate-300 uppercase mb-1">Affected Entity ID</label>
              <input
                type="text"
                required
                value={newEntityId}
                onChange={(e) => setNewEntityId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white outline-none focus:border-cyan-400 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-slate-300 uppercase mb-1">Incident Summary</label>
            <textarea
              rows="3"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Describe operational bottleneck telemetry..."
              className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white outline-none focus:border-cyan-400 text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold shadow-glow-cyan"
            >
              Register Incident
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
