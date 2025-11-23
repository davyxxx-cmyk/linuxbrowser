import React from 'react';
import { SecurityModule } from '../types';
import { Shield, Lock, Activity, Globe } from 'lucide-react';

interface SecurityControlsProps {
  modules: SecurityModule[];
  toggleModule: (id: string) => void;
}

export const SecurityControls: React.FC<SecurityControlsProps> = ({ modules, toggleModule }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          Enforcement Policies
        </h2>
        <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-400">
          KERNEL_VERSION: 6.8.0-generic
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <div 
            key={mod.id} 
            className={`p-4 rounded-lg border transition-all duration-200 ${
              mod.enabled 
                ? 'bg-slate-900/50 border-emerald-500/30' 
                : 'bg-slate-900/20 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  mod.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {mod.id === 'bpf' && <Activity size={18} />}
                  {mod.id === 'apparmor' && <Shield size={18} />}
                  {mod.id === 'seccomp' && <Lock size={18} />}
                  {mod.id === 'netns' && <Globe size={18} />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">{mod.name}</h3>
                  <p className="text-xs text-slate-400">{mod.enabled ? 'Enforcing' : 'Permissive'}</p>
                </div>
              </div>
              <button
                onClick={() => toggleModule(mod.id)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                  mod.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  mod.enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              {mod.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};