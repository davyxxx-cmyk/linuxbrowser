import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DataPoint {
  time: string;
  cpu: number;
  memory: number;
}

interface ResourceMonitorProps {
  data: DataPoint[];
}

export const ResourceMonitor: React.FC<ResourceMonitorProps> = ({ data }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Resource Telemetry</h2>
        <div className="flex gap-4 text-xs font-mono">
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500/50 rounded-sm"></div>
                <span className="text-slate-400">Memory (MB)</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-cyan-500/50 rounded-sm"></div>
                <span className="text-slate-400">CPU (%)</span>
            </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Area 
            type="monotone" 
            dataKey="cpu" 
            stroke="#06b6d4" 
            fillOpacity={1} 
            fill="url(#colorCpu)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="memory" 
            stroke="#a855f7" 
            fillOpacity={1} 
            fill="url(#colorMem)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};