import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCcw,
  Zap,
  Bot
} from 'lucide-react';
import { ActionParser } from '../engine/parser';
import { controlPlane } from '../engine/decisionEngine';
import { globalStore } from '../engine/store';
import { EvaluationResult } from '../engine/types';

interface WhatIfSimulatorViewProps {
  onViewDetail: (evaluation: EvaluationResult) => void;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({ onViewDetail }) => {
  const [refundThreshold, setRefundThreshold] = useState(5000);
  const [testAmount, setTestAmount] = useState(8000);
  const [evalBaseline, setEvalBaseline] = useState<EvaluationResult | null>(null);
  const [evalSimulated, setEvalSimulated] = useState<EvaluationResult | null>(null);

  // Evaluate both baseline (5000) and simulated threshold
  const runSimulation = (threshold: number, amount: number) => {
    // 1. Baseline evaluation with 5,000
    globalStore.setRefundThreshold(5000);
    const baselineAction = ActionParser.parse(`Refund ₹${amount.toLocaleString()} for order ORD-1001`)[0];
    const bRes = controlPlane.evaluate_action(baselineAction);
    setEvalBaseline(bRes);

    // 2. Simulated evaluation with adjusted threshold
    globalStore.setRefundThreshold(threshold);
    const simAction = ActionParser.parse(`Refund ₹${amount.toLocaleString()} for order ORD-1001`)[0];
    const sRes = controlPlane.evaluate_action(simAction);
    setEvalSimulated(sRes);
  };

  React.useEffect(() => {
    runSimulation(refundThreshold, testAmount);
  }, [refundThreshold, testAmount]);

  // Calculate policy impact preview (simulated historical metrics)
  const calculateHistoricalImpact = (newThresh: number) => {
    const delta = (newThresh - 5000) / 1000;
    const actionsAffected = Math.max(0, Math.round(18 + delta * 2.5));
    const movedToAuto = Math.max(0, Math.round(12 + delta * 2.1));
    const remainingBlocked = 4; // Above ₹25k always blocked

    return {
      actionsAffected,
      movedToAuto,
      remainingBlocked
    };
  };

  const impact = calculateHistoricalImpact(refundThreshold);

  return (
    <div id="what-if-simulator-view" className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sliders className="w-3 h-3" />
            WHAT-IF POLICY EXPERIMENTATION
          </span>
          <span className="text-xs font-mono text-slate-400">ZERO MODEL RETRAINING</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          What-If Policy & Threshold Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Change ActionGuard governing thresholds dynamically. See how agent permissions and authorization decisions instantly adapt without fine-tuning or modifying the underlying AI model.
        </p>
      </div>

      {/* Simulator Controls Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slider 1: Autonomous Refund Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="range-refund-threshold" className="text-xs font-bold text-slate-200">
                Autonomous Refund Threshold:
              </label>
              <span className="text-sm font-extrabold font-mono text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                ₹{refundThreshold.toLocaleString()}
              </span>
            </div>
            <input
              id="range-refund-threshold"
              type="range"
              min="2000"
              max="20000"
              step="1000"
              value={refundThreshold}
              onChange={e => setRefundThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>₹2,000 (Strict)</span>
              <span>₹5,000 (Default)</span>
              <span>₹10,000 (Relaxed)</span>
              <span>₹20,000 (Aggressive)</span>
            </div>
          </div>

          {/* Slider 2: Test Action Request Amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="range-test-amount" className="text-xs font-bold text-slate-200">
                Simulated Customer Refund Request:
              </label>
              <span className="text-sm font-extrabold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                ₹{testAmount.toLocaleString()}
              </span>
            </div>
            <input
              id="range-test-amount"
              type="range"
              min="2000"
              max="30000"
              step="1000"
              value={testAmount}
              onChange={e => setTestAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>₹2,000</span>
              <span>₹8,000 (Test)</span>
              <span>₹15,000</span>
              <span>₹30,000 (Critical)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side by Side Comparative Decision Test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline Card (Standard ₹5,000 Threshold) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">CURRENT DEFAULT POLICY</span>
              <h3 className="text-sm font-bold text-white">Autonomous Limit: ₹5,000</h3>
            </div>
            {evalBaseline && (
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                evalBaseline.decision === 'ALLOW'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : evalBaseline.decision === 'REQUIRE_APPROVAL'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {evalBaseline.decision}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-slate-400">
              Request: <span className="font-mono text-slate-200">Refund ₹{testAmount.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 text-slate-300 border border-slate-800/80 leading-relaxed">
              {evalBaseline?.summaryReason}
            </div>
          </div>
        </div>

        {/* What-If Simulated Card */}
        <div className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-4 ${
          evalSimulated?.decision === 'ALLOW'
            ? 'border-emerald-500/40 bg-emerald-950/10'
            : evalSimulated?.decision === 'REQUIRE_APPROVAL'
            ? 'border-amber-500/40 bg-amber-950/10'
            : 'border-rose-500/40 bg-rose-950/10'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">WHAT-IF SIMULATED POLICY</span>
              <h3 className="text-sm font-bold text-white">Autonomous Limit: ₹{refundThreshold.toLocaleString()}</h3>
            </div>
            {evalSimulated && (
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                evalSimulated.decision === 'ALLOW'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : evalSimulated.decision === 'REQUIRE_APPROVAL'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {evalSimulated.decision}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-slate-400">
              Request: <span className="font-mono text-slate-200">Refund ₹{testAmount.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 text-slate-300 border border-slate-800/80 leading-relaxed">
              {evalSimulated?.summaryReason}
            </div>
          </div>
        </div>
      </div>

      {/* Policy Impact Preview Section */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono text-blue-400 font-bold">PROJECTED ENTERPRISE METRICS</span>
            <h3 className="text-base font-bold text-white">Policy Impact Preview</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            DEMO / SIMULATED DATA
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Simulated backtest across historical agent transactions evaluating how raising or lowering this threshold would impact operational review queues.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-2xl font-extrabold text-blue-400 font-mono">{impact.actionsAffected}</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Actions Affected</div>
            <div className="text-[10px] text-slate-500">Historical tickets re-evaluated</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">{impact.movedToAuto}</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Approval → Auto-Allowed</div>
            <div className="text-[10px] text-emerald-400/80">Shifted to autonomous execution</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-2xl font-extrabold text-rose-400 font-mono">{impact.remainingBlocked}</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Remaining Blocked</div>
            <div className="text-[10px] text-slate-500">Violated absolute ceiling (&gt; ₹25k)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
