import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Clock } from 'lucide-react';

interface BotConsoleProps {
  logs: LogEntry[];
}

export const BotConsole: React.FC<BotConsoleProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-black rounded-xl border border-slate-700 flex flex-col h-full shadow-lg overflow-hidden">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-sm font-mono text-slate-300 flex items-center gap-2">
          <Terminal size={14} className="text-green-500" />
          SYSTEM_LOGS
        </h3>
        <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-thin">
        {logs.length === 0 && (
            <div className="text-slate-600 italic">Sistem başlatıldı. İşlem bekleniyor...</div>
        )}
        {logs.map(log => (
          <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-slate-600 shrink-0">
              [{log.timestamp.toLocaleTimeString('tr-TR')}]
            </span>
            <span className={`break-all ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-green-400' :
              log.type === 'warning' ? 'text-yellow-400' :
              'text-blue-300'
            }`}>
              {log.account && <span className="text-slate-500 mr-2">@{log.account}:</span>}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};