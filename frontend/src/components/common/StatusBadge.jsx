import React from 'react';

export const StatusBadge = ({ status, type = 'status' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace(/\s+/g, '_');

  let style = 'bg-slate-800/80 text-slate-300 border-slate-700';

  if (type === 'severity') {
    switch (normalized) {
      case 'critical':
        style = 'bg-rose-950/70 text-rose-300 border-rose-600/40 shadow-sm shadow-rose-950/50';
        break;
      case 'high':
        style = 'bg-amber-950/70 text-amber-300 border-amber-600/40';
        break;
      case 'medium':
        style = 'bg-cyan-950/70 text-cyan-300 border-cyan-600/40';
        break;
      case 'low':
        style = 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40';
        break;
    }
  } else if (type === 'scenario') {
    switch (normalized) {
      case 'delayed_order':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Delayed E-Commerce
          </span>
        );
      case 'inventory_shortage':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-950/80 text-violet-300 border border-violet-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
            Inventory Shortage
          </span>
        );
      case 'payment_failure':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/80 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Payment Failure
          </span>
        );
    }
  } else if (type === 'blast_radius') {
    switch (normalized) {
      case 'high':
        style = 'bg-rose-950/80 text-rose-300 border-rose-500/50 font-semibold';
        break;
      case 'medium':
        style = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
        break;
      case 'low':
        style = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
        break;
    }
  } else {
    switch (normalized) {
      case 'open':
        style = 'bg-blue-950/60 text-blue-300 border-blue-500/30';
        break;
      case 'investigating':
      case 'planning':
      case 'executing':
      case 'verifying':
      case 'running':
      case 'in_progress':
        style = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 animate-pulse';
        break;
      case 'pending_approval':
      case 'waiting_approval':
        style = 'bg-amber-950/60 text-amber-300 border-amber-500/40 font-semibold';
        break;
      case 'resolved':
      case 'completed':
      case 'executed':
      case 'approved':
        style = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
        break;
      case 'failed':
      case 'rejected':
        style = 'bg-rose-950/60 text-rose-300 border-rose-500/40';
        break;
      case 'stopped':
      case 'cancelled':
        style = 'bg-surface-muted text-ink-muted border-line-subtle';
        break;
    }
  }

  const formatText = (text) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {formatText(status)}
    </span>
  );
};
