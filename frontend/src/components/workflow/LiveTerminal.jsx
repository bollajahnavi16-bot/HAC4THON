import React, { useRef, useEffect } from 'react';
import { Terminal, Shield } from 'lucide-react';

export const LiveTerminal = ({ logs = [], title = 'Agent Execution Telemetry & Logs' }) => {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [logs]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#060A14] overflow-hidden shadow-2xl font-mono text-xs flex flex-col h-[360px]">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-navy-950 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="ml-2 font-semibold text-[11px] text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            {title}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          STDOUT • {logs.length} entries
        </span>
      </div>

      {/* Terminal Content Buffer */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 selection:bg-cyan-500/30 selection:text-cyan-200">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            &gt; Awaiting agent dispatch... Standby for live telemetry streams.
          </div>
        ) : (
          logs.map((log, i) => {
            const timeStr = log.timestamp
              ? new Date(log.timestamp).toLocaleTimeString()
              : '00:00:00';

            let levelColor = 'text-cyan-400';
            let prefix = '[INFO]';
            if (log.level === 'warn') {
              levelColor = 'text-amber-400';
              prefix = '[WARN]';
            } else if (log.level === 'error') {
              levelColor = 'text-rose-400';
              prefix = '[ERR!]';
            } else if (log.level === 'success') {
              levelColor = 'text-emerald-400';
              prefix = '[PASS]';
            }

            return (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 select-none text-[10px]">
                  {timeStr}
                </span>
                <span className={`font-bold select-none text-[11px] ${levelColor}`}>
                  {prefix}
                </span>
                <span className="text-slate-200 break-words flex-1">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
