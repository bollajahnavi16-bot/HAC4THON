import React from 'react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
      shadow: 'hover:shadow-glow-cyan',
      glow: 'from-cyan-500/10 to-transparent',
    },
    violet: {
      border: 'border-violet-500/20 hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/30',
      shadow: 'hover:shadow-glow-violet',
      glow: 'from-violet-500/10 to-transparent',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      shadow: 'hover:shadow-emerald-500/10',
      glow: 'from-emerald-500/10 to-transparent',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      shadow: 'hover:shadow-amber-500/10',
      glow: 'from-amber-500/10 to-transparent',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      shadow: 'hover:shadow-rose-500/10',
      glow: 'from-rose-500/10 to-transparent',
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-surface-card p-5 border border-line-subtle hover:border-line-strong transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {title}
          </p>
          <h3 className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-ink-primary font-mono tabular-nums">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg border ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold border-t border-line-subtle/50 pt-2.5">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
