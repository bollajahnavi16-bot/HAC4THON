import React from 'react';

export const Loader = ({ message = 'AgentOps AI reasoning engine active...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-violet-400 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-300 animate-spin [animation-duration:1.5s]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-300 font-mono tracking-wide">
        {message}
      </p>
    </div>
  );
};
