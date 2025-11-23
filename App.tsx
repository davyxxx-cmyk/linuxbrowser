import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  Layers, 
  Settings, 
  Search,
  AlertTriangle,
  Menu,
  Activity
} from 'lucide-react';
import { SecurityControls } from './components/SecurityControls';
import { ProcessVisualizer } from './components/ProcessVisualizer';
import { Terminal } from './components/Terminal';
import { ResourceMonitor } from './components/ResourceMonitor';
import { LogEntry, SecurityModule, ProcessNode } from './types';

// Mock Data
const INITIAL_LOGS: LogEntry[] = [
  { id: '1', timestamp: '10:00:01', level: 'INFO', component: 'launcher', message: 'Chimera Launcher initialized (uid=0)' },
  { id: '2', timestamp: '10:00:01', level: 'INFO', component: 'ns_setup', message: 'Unsharing namespaces: NEWUSER NEWNET NEWNS NEWPID' },
  { id: '3', timestamp: '10:00:02', level: 'INFO', component: 'caps', message: 'Dropped capabilities: Effective, Permitted, Inheritable' },
  { id: '4', timestamp: '10:00:02', level: 'INFO', component: 'seccomp', message: 'Filter loaded: 14 syscalls allowed' },
  { id: '5', timestamp: '10:00:03', level: 'INFO', component: 'launcher', message: 'Exec: chimera-browser (sandbox active)' },
  { id: '6', timestamp: '10:00:05', level: 'DEBUG', component: 'bpf', message: 'LSM attached: socket_connect' },
];

const INITIAL_PROCESS_DATA: ProcessNode = {
  name: 'chimera-launcher',
  pid: 1240,
  type: 'launcher',
  children: [
    {
      name: 'chimera-browser',
      pid: 1241,
      type: 'browser',
      children: [
        { name: 'render-gpu', pid: 1245, type: 'sandbox', children: [] },
        { name: 'net-thread', pid: 1246, type: 'network', children: [] },
        { name: 'tab-isolate-1', pid: 1250, type: 'sandbox', children: [] },
      ]
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [modules, setModules] = useState<SecurityModule[]>([
    { id: 'apparmor', name: 'AppArmor Profiles', enabled: true, status: 'active', description: '/etc/apparmor.d/usr.bin.chimera-browser enforced' },
    { id: 'seccomp', name: 'Seccomp-BPF', enabled: true, status: 'active', description: 'Strict syscall filtering whitelist active' },
    { id: 'bpf', name: 'eBPF LSM', enabled: true, status: 'active', description: 'Socket connect hooks attached' },
    { id: 'netns', name: 'Network Namespaces', enabled: false, status: 'warning', description: 'Tor per-tab isolation (pending)' },
  ]);

  const [resourceData, setResourceData] = useState<any[]>([]);

  // Simulate resource usage and logs
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      // Update Resources
      setResourceData(prev => {
        const newData = [...prev, {
          time: timeStr,
          cpu: 10 + Math.random() * 15,
          memory: 200 + Math.random() * 50
        }];
        return newData.slice(-20); // Keep last 20
      });

      // Randomly add logs
      if (Math.random() > 0.8) {
        const msgType = Math.random();
        let newLog: LogEntry;
        
        if (msgType > 0.9) {
           newLog = { id: Date.now().toString(), timestamp: timeStr, level: 'WARN', component: 'seccomp', message: `Syscall blocked: SYS_ptrace (${Math.floor(Math.random() * 9999)})` };
        } else if (msgType > 0.6) {
           newLog = { id: Date.now().toString(), timestamp: timeStr, level: 'DEBUG', component: 'netns', message: `Packet drop: out-of-bounds destination` };
        } else {
           newLog = { id: Date.now().toString(), timestamp: timeStr, level: 'INFO', component: 'browser', message: 'Garbage collection in isolated heap' };
        }
        setLogs(prev => [...prev, newLog]);
      }

    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'WARN',
      component: 'user_action',
      message: `Security module ${id} toggled by admin`
    }]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-emerald-500/20 shadow-lg">
            <Shield className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">CHIMERA</h1>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Layers size={18} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
             onClick={() => setActiveTab('security')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'security' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Shield size={18} />
            <span className="font-medium">Security Policy</span>
          </button>

          <button 
             onClick={() => setActiveTab('network')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'network' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Activity size={18} />
            <span className="font-medium">Telemetry</span>
          </button>
        </nav>

        <div className="mt-auto p-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">System Status</h3>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-mono text-emerald-400">SECURE_BOOT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-mono text-emerald-400">LOCKDOWN: ON</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">System Dashboard</h2>
            <p className="text-slate-400">Monitoring runtime integrity for PID 1240 (chimera-launcher)</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-sm font-mono">0 THREATS</span>
             </div>
             <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20">
                Run Audit
             </button>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SecurityControls modules={modules} toggleModule={toggleModule} />
            <ProcessVisualizer data={INITIAL_PROCESS_DATA} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
                 <ResourceMonitor data={resourceData} />
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col justify-center items-center text-center">
                 <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-4 relative">
                    <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500 animate-spin"></div>
                    <span className="text-3xl font-bold text-white">100%</span>
                 </div>
                 <h3 className="text-lg font-semibold text-white">Integrity Score</h3>
                 <p className="text-sm text-slate-400 mt-2">All kernel hooks verified.</p>
                 <p className="text-sm text-slate-400">AppArmor enforcing mode.</p>
            </div>
        </div>

        {/* Terminal */}
        <Terminal logs={logs} />
      </main>
    </div>
  );
}