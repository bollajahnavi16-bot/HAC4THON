import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Loader } from '../components/common/Loader';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Code2,
} from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [actorFilter, setActorFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const { addToast } = useApp();

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getAll({
        actorType: actorFilter,
        outcome: outcomeFilter,
        search,
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      addToast({
        title: 'Error loading audit logs',
        message: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actorFilter, outcomeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAuditLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Execution History & Audit Trail</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Immutable, compliance-ready ledger tracking every autonomous agent action and human decision
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, action, actor, or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">All Actors</option>
            <option value="agent">Autonomous Agents</option>
            <option value="user">Human Operators</option>
            <option value="system">System Bootloader</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="failure">Failure</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <Loader message="Loading immutable audit trail records..." />
      ) : logs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-navy-900/40 text-slate-400">
          <p className="text-sm font-semibold text-white">No audit records found.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting search filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-navy-900/80 overflow-hidden shadow-glow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Audit ID</th>
                  <th className="py-3.5 px-4 font-semibold">Actor</th>
                  <th className="py-3.5 px-4 font-semibold">Action Type</th>
                  <th className="py-3.5 px-4 font-semibold">Incident</th>
                  <th className="py-3.5 px-4 font-semibold">Outcome</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-navy-850/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold whitespace-nowrap">
                      {log.auditId}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white">{log.actorName}</span>
                      <span className="block text-[10px] font-mono text-slate-400 uppercase">
                        [{log.actorType}]
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                      {log.actionType}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-violet-300 whitespace-nowrap">
                      {log.incidentCode || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          log.outcome === 'success'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                            : log.outcome === 'warning'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                            : log.outcome === 'failure'
                            ? 'bg-rose-950 text-rose-300 border-rose-500/30'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Audit Log Payload Inspector */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Audit Record: ${selectedLog?.auditId || ''}`}
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Actor:</span>
                <p className="text-white font-bold">{selectedLog.actorName} ({selectedLog.actorType})</p>
              </div>
              <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Action:</span>
                <p className="text-white font-bold">{selectedLog.actionType}</p>
              </div>
            </div>

            {selectedLog.verificationHash && (
              <div className="p-3 rounded-xl bg-navy-950 border border-cyan-500/30">
                <span className="font-mono text-[10px] text-cyan-400 uppercase">
                  SHA-256 Verification Signature:
                </span>
                <p className="font-mono text-[11px] text-slate-200 break-all mt-1">
                  {selectedLog.verificationHash}
                </p>
              </div>
            )}

            <div>
              <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                Raw Audit Event Details:
              </span>
              <pre className="p-4 rounded-xl bg-navy-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-72">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
