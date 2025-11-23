import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[300px]">
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-slate-400" />
          <span className="text-sm font-mono text-slate-300">chimera-runtime.log</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
        </div>
      </div>
      <div className="p-4 overflow-y-auto font-mono text-xs md:text-sm flex-1 scrollbar-hide">
        {logs.map((log) => (
          <div key={log.id} className="mb-1 opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
            <span className={`font-bold mr-2 ${
              log.level === 'INFO' ? 'text-blue-400' :
              log.level === 'WARN' ? 'text-amber-400' :
              log.level === 'ERROR' ? 'text-red-400' : 'text-purple-400'
            }`}>
              {log.level}
            </span>
            <span className="text-emerald-700 mr-2">[{log.component}]</span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};