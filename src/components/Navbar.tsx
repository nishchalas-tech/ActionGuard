import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, Cpu, ChevronRight, Zap } from 'lucide-react';
import { globalStore } from '../engine/store';

interface NavbarProps {
  onRunFullDemo: () => void;
  onResetData?: () => void;
  autonomyLevel?: number;
  onSetAutonomyLevel?: (lvl: number) => void;
  pendingCount?: number;
  onNavigate?: (view: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRunFullDemo,
  onResetData = () => globalStore.resetToDefaults(),
  autonomyLevel = globalStore.getAutonomyLevel(),
  onSetAutonomyLevel = (lvl: number) => globalStore.setAutonomyLevel(lvl),
  pendingCount = 0,
  onNavigate
}) => {
  const [providerStatus, setProviderStatus] = useState<{ provider: string; status: string; model?: string; hasApiKey?: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/provider-status')
      .then(res => res.json())
      .then(data => setProviderStatus(data))
      .catch(() => {
        setProviderStatus({ provider: 'FALLBACK', status: 'FALLBACK_MODE_ACTIVE', model: 'deterministic-regex-parser', hasApiKey: false });
      });
  }, []);

  const autonomyLevels = [
    { level: 0, label: 'L0: No Autonomy', desc: 'Human only' },
    { level: 1, label: 'L1: AI Recommends', desc: 'Human initiates' },
    { level: 2, label: 'L2: Approval Required', desc: 'Every action requires signoff' },
    { level: 3, label: 'L3: Autonomous Low-Risk', desc: 'AI executes low-risk actions' },
    { level: 4, label: 'L4: Governed Autonomy', desc: 'High-risk remains human' }
  ];

  return (
    <header
      id="actionguard-header"
      className="h-16 bg-slate-950/90 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur"
    >
      {/* Left: Tagline & Core Principle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 hidden md:inline">Tagline:</span>
        <span className="text-xs md:text-sm font-bold tracking-tight text-slate-100 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
          <span className="text-amber-400">“AI can propose.</span>{' '}
          <span className="text-blue-400">ActionGuard decides.”</span>
        </span>

        {/* AI Provider Status Pill */}
        {providerStatus && (
          <div
            title={
              providerStatus.hasApiKey
                ? `Groq runtime connected with model ${providerStatus.model}`
                : 'Deterministic guardrails active. Add GROQ_API_KEY in Secrets for live Groq LLM parsing.'
            }
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
              providerStatus.hasApiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                providerStatus.hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>
              AI: {providerStatus.provider === 'GROQ' ? 'GROQ LIVE' : 'FALLBACK GUARDRAILS'}
            </span>
            <span className="opacity-60 text-[10px]">({providerStatus.model?.split('-')[0] || 'regex'})</span>
          </div>
        )}
      </div>

      {/* Right: Controls & Presenter Action */}
      <div className="flex items-center gap-3">
        {/* Controlled Autonomy Framework Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
          <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-slate-400 text-[11px] font-medium">Autonomy Framework:</span>
          <select
            id="autonomy-level-selector"
            value={autonomyLevel}
            onChange={e => onSetAutonomyLevel(Number(e.target.value))}
            aria-label="Controlled Autonomy Level"
            className="bg-slate-950 text-blue-300 font-semibold rounded border border-slate-700/80 px-2 py-0.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {autonomyLevels.map(al => (
              <option key={al.level} value={al.level}>
                {al.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Demo Data Button */}
        <button
          id="btn-reset-data"
          onClick={onResetData}
          title="Reset back to initial demo state"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* RUN FULL DEMO Button */}
        <button
          id="btn-run-full-demo"
          onClick={onRunFullDemo}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-md shadow-blue-600/30 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>RUN FULL DEMO</span>
        </button>
      </div>
    </header>
  );
};
