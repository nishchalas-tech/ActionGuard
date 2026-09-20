import React from 'react';
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Lock,
  Workflow,
  Cpu,
  ArrowRight,
  Server,
  Terminal,
  FileCheck2,
  Zap,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { TrustBoundaryBanner } from '../components/TrustBoundaryBanner';

export const EnterpriseFrameworkView: React.FC = () => {
  return (
    <div id="enterprise-framework-view" className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-3 h-3" />
            ENTERPRISE ARCHITECTURE
          </span>
          <span className="text-xs font-mono text-slate-400">CONTROL PLANE DESIGN</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          System Architecture & Controlled Autonomy
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          ActionGuard establishes an independent trust boundary between probabilistic AI agent reasoning and deterministic enterprise execution tools.
        </p>
      </div>

      {/* Trust Boundary Diagram */}
      <TrustBoundaryBanner />

      {/* Decision Pipeline Flow */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Workflow className="w-4 h-4 text-blue-400" />
          <span>Deterministic 7-Stage Decision Pipeline</span>
        </h2>
        <p className="text-xs text-slate-400">
          Every proposed action passes through a sequential, non-bypassable control chain with fail-safe defaults:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-2">
          {[
            { step: '1. Ingest & Parse', desc: 'Isolate request, extract parameters & target entity' },
            { step: '2. Threat Scan', desc: 'Check prompt injection, jailbreaks, and policy overrides' },
            { step: '3. Context Engine', desc: 'Evaluate environment sensitivity & external destinations' },
            { step: '4. RBAC Check', desc: 'Validate agent role limits & permission boundaries' },
            { step: '5. Policy Engine', desc: 'Enforce financial ceilings & business rules' },
            { step: '6. Risk Engine', desc: 'Calculate deterministic composite risk score' },
            { step: '7. Central Decision', desc: 'Render binding ALLOW, REQUIRE_APPROVAL, or BLOCK' }
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] font-mono font-bold text-blue-400">{item.step}</div>
              <div className="text-[11px] text-slate-400 leading-snug">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controlled Autonomy Framework Levels */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div>
          <span className="text-xs font-mono text-indigo-400 font-bold">MATURITY MODEL</span>
          <h2 className="text-base font-bold text-white mt-0.5">The 4 Levels of AI Autonomy</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprises do not have to choose between zero autonomy and reckless AI execution. ActionGuard enables progressive, safe delegation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
              LEVEL 1
            </span>
            <h3 className="text-sm font-bold text-white">Fully Supervised</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every action requires explicit human approval. Zero autonomous tool execution. Suitable for experimental or untrusted agents.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300">
              LEVEL 2
            </span>
            <h3 className="text-sm font-bold text-white">Policy-Constrained</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Safe read-only actions execute autonomously. All state-changing or write actions require supervisory approval.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 bg-emerald-950/10 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LEVEL 3 • CURRENT
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Risk-Governed (ActionGuard)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Low-risk financial (≤ ₹5,000) and communications execute automatically. High-value transactions route to Human Approval Center.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300">
              LEVEL 4
            </span>
            <h3 className="text-sm font-bold text-white">Full Guarded Autonomy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autonomous execution up to ₹25,000 under anomaly surveillance. Hard security locks permanently block root access and credential leaks.
            </p>
          </div>
        </div>
      </div>

      {/* Enterprise Use Cases */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Real-World Enterprise Deployment Scenarios</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">1. E-Commerce & Customer Support</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                FINANCIAL GUARDRAILS
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Support agents resolve damaged delivery complaints instantly by issuing refunds under ₹5,000 without waiting for human queues. Fraudulent spikes or large claims are routed to finance supervisors.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-950 p-2 rounded">
              Rule: Refund ≤ ₹5,000 → ALLOW | Refund &gt; ₹5,000 → REQUIRE APPROVAL
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">2. Internal IT & Identity Governance</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400">
                PRIVILEGE LOCKDOWN
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              IT helpdesk agents automate password resets and access provisioning for standard SaaS tools. When an agent attempts to grant root or production database access, ActionGuard permanently blocks the operation.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-950 p-2 rounded">
              Rule: Target == "production_database" → HARD BLOCK
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">3. DevOps & Cloud Infrastructure</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                DESTRUCTIVE BARRIER
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autonomous agents scale staging containers and rotate development credentials. Modifying production DNS, deleting customer databases, or disabling firewall rules is blocked by the context sensitivity engine.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-950 p-2 rounded">
              Rule: Environment == "production" & Destructive → REQUIRE APPROVAL
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">4. Financial & Corporate Treasury</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
                ACCOUNT VERIFICATION
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accounting bots reconcile vendor invoices and verify transaction amounts. Any divergence from verified recipient accounts or external destination changes flags high risk and alerts the security officer.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-950 p-2 rounded">
              Rule: External Destination Divergence → THREAT SIGNAL + REQUIRE APPROVAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
