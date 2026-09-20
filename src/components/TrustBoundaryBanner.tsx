import React from 'react';
import { Shield, ArrowRight, Bot, Lock, Wrench, CheckCircle2 } from 'lucide-react';

export const TrustBoundaryBanner: React.FC = () => {
  return (
    <div id="trust-boundary-banner" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 mb-6 shadow-lg backdrop-blur">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-3 h-3" />
              SYSTEM ARCHITECTURE
            </span>
            <span className="text-xs text-slate-400 font-mono">ENFORCEMENT PIPELINE</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            The ActionGuard Trust Boundary
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            The AI agent is an untrusted proposal engine. Only the deterministic ActionGuard control plane can authorize tool execution.
          </p>
        </div>

        {/* Visual Pipeline */}
        <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
          {/* Node 1: Untrusted Agent */}
          <div className="flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Bot className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] leading-tight">UNTRUSTED AGENT</div>
              <div className="text-[10px] text-amber-400/80">Proposes Action</div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />

          {/* Node 2: ActionGuard Control Plane */}
          <div className="flex-1 sm:flex-initial flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-300 shadow-sm">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-blue-200 leading-tight">ACTIONGUARD</div>
              <div className="text-[10px] text-blue-300/80">Policy • Risk • Security</div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />

          {/* Node 3: Trusted Tool */}
          <div className="flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] leading-tight">SAFE TOOL</div>
              <div className="text-[10px] text-emerald-400/80">Authorized Execution</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
