import React, { useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Zap,
  Clock,
  Layers,
  Wrench
} from 'lucide-react';
import { ActionParser } from '../engine/parser';
import { controlPlane } from '../engine/decisionEngine';
import { globalStore } from '../engine/store';
import { EvaluationResult } from '../engine/types';

interface AgentSimulatorViewProps {
  onViewDetail: (evaluation: EvaluationResult) => void;
  onApprove: (actionId: string) => void;
}

interface WorkflowStep {
  stepNumber: number;
  label: string;
  actionType: string;
  payload: string;
  status: 'PENDING' | 'RUNNING' | 'HALTED_FOR_APPROVAL' | 'ALLOWED' | 'COMPLETED' | 'BLOCKED';
  evaluation?: EvaluationResult;
}

export const AgentSimulatorView: React.FC<AgentSimulatorViewProps> = ({
  onViewDetail,
  onApprove
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([
    {
      stepNumber: 1,
      label: '1. Look Up Customer Order & History',
      actionType: 'support:ticket:read',
      payload: 'Query customer ORD-1001 purchase records and return item condition history',
      status: 'COMPLETED'
    },
    {
      stepNumber: 2,
      label: '2. Issue High-Value Compensation Refund (₹12,000)',
      actionType: 'issue_refund',
      payload: 'Refund ₹12,000 for order ORD-1001',
      status: 'PENDING'
    },
    {
      stepNumber: 3,
      label: '3. Dispatch Customer Confirmation Email',
      actionType: 'send_email',
      payload: 'Send an email to Rahul telling him his refund has been approved',
      status: 'PENDING'
    }
  ]);

  const runStep2 = () => {
    setIsRunning(true);
    setTimeout(() => {
      const actions = ActionParser.parse('Refund ₹12,000 for order ORD-1001.');
      const res = controlPlane.evaluate_action(actions[0]);
      globalStore.addEvaluation(res);

      setWorkflow(prev =>
        prev.map(step => {
          if (step.stepNumber === 2) {
            return {
              ...step,
              status: 'HALTED_FOR_APPROVAL',
              evaluation: res
            };
          }
          return step;
        })
      );
      setActiveStep(2);
      setIsRunning(false);
    }, 400);
  };

  const handleApproveStep2 = () => {
    const step2 = workflow.find(s => s.stepNumber === 2);
    if (step2 && step2.evaluation) {
      onApprove(step2.evaluation.actionId);
      // Now proceed to step 3!
      const emailActions = ActionParser.parse('Send an email to Rahul telling him his refund has been approved');
      const emailRes = controlPlane.evaluate_action(emailActions[0]);
      globalStore.addEvaluation(emailRes);

      setWorkflow(prev =>
        prev.map(step => {
          if (step.stepNumber === 2) {
            return { ...step, status: 'COMPLETED' };
          }
          if (step.stepNumber === 3) {
            return { ...step, status: 'COMPLETED', evaluation: emailRes };
          }
          return step;
        })
      );
      setActiveStep(3);
    }
  };

  const handleReset = () => {
    setActiveStep(1);
    setIsRunning(false);
    setWorkflow([
      {
        stepNumber: 1,
        label: '1. Look Up Customer Order & History',
        actionType: 'support:ticket:read',
        payload: 'Query customer ORD-1001 purchase records and return item condition history',
        status: 'COMPLETED'
      },
      {
        stepNumber: 2,
        label: '2. Issue High-Value Compensation Refund (₹12,000)',
        actionType: 'issue_refund',
        payload: 'Refund ₹12,000 for order ORD-1001',
        status: 'PENDING'
      },
      {
        stepNumber: 3,
        label: '3. Dispatch Customer Confirmation Email',
        actionType: 'send_email',
        payload: 'Send an email to Rahul telling him his refund has been approved',
        status: 'PENDING'
      }
    ]);
  };

  return (
    <div id="agent-simulator-view" className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bot className="w-3 h-3" />
            AUTONOMOUS AGENT GOVERNANCE
          </span>
          <span className="text-xs font-mono text-slate-400">SUPPORT AGENT SIMULATOR</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Autonomous Agent Execution Interception
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Simulate an autonomous agent executing a multi-step customer complaint resolution workflow. Observe how ActionGuard intercepts consequential actions before any tool execution.
        </p>
      </div>

      {/* Agent Identity & Objective Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-mono">Agent Identity</div>
            <div className="text-sm font-bold text-white">SupportAgent-01</div>
            <div className="text-[11px] text-indigo-400 font-mono">Role: AI_AGENT</div>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 uppercase font-mono">Assigned Business Objective</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5">
            "Resolve customer complaint for ORD-1001 quickly"
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Strategy: Autonomous resolution</div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            id="btn-reset-workflow"
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Workflow"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {workflow[1].status === 'PENDING' ? (
            <button
              id="btn-start-agent-workflow"
              onClick={runStep2}
              disabled={isRunning}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Next Agent Action</span>
            </button>
          ) : workflow[1].status === 'HALTED_FOR_APPROVAL' ? (
            <button
              id="btn-human-approve-agent"
              onClick={handleApproveStep2}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Grant Human Approval</span>
            </button>
          ) : (
            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/30 font-bold">
              WORKFLOW COMPLETED
            </div>
          )}
        </div>
      </div>

      {/* Stepped Multi-Action Workflow Pipeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Stepped Autonomous Action Sequence</span>
        </h2>

        {workflow.map((item, idx) => {
          const isCurrent = activeStep === item.stepNumber;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                item.status === 'HALTED_FOR_APPROVAL'
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10'
                  : item.status === 'COMPLETED'
                  ? 'bg-slate-900/90 border-emerald-500/30'
                  : 'bg-slate-900/50 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-400">{item.label}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.actionType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    "{item.payload}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'COMPLETED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      COMPLETED
                    </span>
                  )}
                  {item.status === 'HALTED_FOR_APPROVAL' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      HALTED BY ACTIONGUARD
                    </span>
                  )}
                  {item.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-slate-800 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      AWAITING PREREQUISITE
                    </span>
                  )}

                  {item.evaluation && (
                    <button
                      onClick={() => onViewDetail(item.evaluation!)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Trace
                    </button>
                  )}
                </div>
              </div>

              {/* Interception Narrative Callout */}
              {item.status === 'HALTED_FOR_APPROVAL' && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>ActionGuard Interception: Autonomous Authority Ceiling Exceeded</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    SupportAgent-01 attempted to disburse ₹12,000. Autonomous threshold is ₹5,000. The agent was <strong>disallowed from self-authorizing</strong> the refund tool. Tool execution is paused until a human supervisor reviews and signs off.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleApproveStep2}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Approve ₹12,000 Refund as Supervisor
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Step 3 (confirmation email) depends on this refund succeeding.
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
