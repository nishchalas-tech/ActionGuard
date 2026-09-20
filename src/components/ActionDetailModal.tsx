import React from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UserCheck,
  KeyRound,
  Gauge,
  Terminal,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { EvaluationResult } from '../engine/types';

interface ActionDetailModalProps {
  evaluation: EvaluationResult | null;
  onClose: () => void;
  onApprove?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
}

export const ActionDetailModal: React.FC<ActionDetailModalProps> = ({
  evaluation,
  onClose,
  onApprove,
  onReject
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!evaluation) return null;

  const {
    traceId,
    actionId,
    proposedAction,
    decision,
    summaryReason,
    policyResult,
    permissionResult,
    riskResult,
    securityResult,
    contextResult,
    approvalStatus,
    toolExecution,
    timeline,
    timestamp
  } = evaluation;

  const copyTrace = () => {
    navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDecisionBadge = () => {
    switch (decision) {
      case 'ALLOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ALLOW
          </span>
        );
      case 'REQUIRE_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            REQUIRE HUMAN APPROVAL
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            BLOCK
          </span>
        );
    }
  };

  return (
    <div
      id="action-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="action-detail-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-400 font-medium">Trace ID:</span>
              <button
                onClick={copyTrace}
                className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 hover:bg-blue-500/20"
              >
                <span>{traceId}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
              Action Investigation & Control Plane Trace
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {getDecisionBadge()}
            <button
              id="btn-close-detail-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Natural Request & Untrusted Proposal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  UNTRUSTED AGENT REQUEST
                </span>
                <span className="text-[11px] font-mono text-slate-500">{proposedAction.agentId}</span>
              </div>
              <p className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono leading-relaxed">
                "{proposedAction.rawRequest}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  STRUCTURED ACTION PROPOSAL
                </span>
                <span className="text-[11px] font-mono uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  {proposedAction.type}
                </span>
              </div>
              <pre className="text-[11px] font-mono text-blue-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                {JSON.stringify(
                  {
                    action: proposedAction.type,
                    target: proposedAction.target,
                    parameters: proposedAction.parameters,
                    agentRole: proposedAction.agentRole
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          {/* Section 2: Summary Decision Reason */}
          <div className={`p-4 rounded-xl border ${
            decision === 'ALLOW'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : decision === 'REQUIRE_APPROVAL'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>CONTROL PLANE EVALUATION SUMMARY</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-200">
              {summaryReason}
            </p>
          </div>

          {/* Section 3: Guardrail Engines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Policy Check */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Policy Engine
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  policyResult.outcome === 'ALLOW'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : policyResult.outcome === 'REQUIRE_APPROVAL'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {policyResult.result}
                </span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="text-slate-300 font-semibold">{policyResult.policyName}</div>
                <div className="text-slate-400 text-[11px]">{policyResult.reason}</div>
                {policyResult.matchedRule && (
                  <div className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                    Rule: {policyResult.matchedRule}
                  </div>
                )}
              </div>
            </div>

            {/* Permission Check */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Permission Engine
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  permissionResult.allowed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {permissionResult.allowed ? 'AUTHORIZED' : 'PRIVILEGE EXCEEDED'}
                </span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="text-slate-300 font-mono text-[11px]">
                  Role: <span className="text-indigo-400 font-bold">{permissionResult.role}</span>
                </div>
                <div className="text-slate-400 text-[11px]">{permissionResult.reason}</div>
                <ul className="text-[10px] space-y-1 text-slate-400">
                  {permissionResult.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-slate-600">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risk Engine Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  Risk Engine (Deterministic Scoring)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  riskResult.level === 'LOW'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : riskResult.level === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {riskResult.level} ({riskResult.score} pts)
                </span>
              </div>
              <div className="space-y-1.5">
                {riskResult.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] bg-slate-900/60 p-1.5 rounded">
                    <span className="text-slate-300">{f.factor}</span>
                    <span className="font-mono text-amber-400 font-semibold">+{f.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Threat Engine */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Security Engine (Threat Detection)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  securityResult.passed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {securityResult.status}
                </span>
              </div>
              {securityResult.threats.length === 0 ? (
                <div className="text-xs text-emerald-400/90 flex items-center gap-2 p-2 rounded bg-emerald-500/5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No prompt-injection, policy-override, or exfiltration patterns detected.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {securityResult.threats.map((t, i) => (
                    <div key={i} className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs">
                      <div className="font-bold text-rose-400 flex items-center justify-between">
                        <span>{t.type}</span>
                        <span className="text-[10px] uppercase font-mono">{t.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">{t.description}</p>
                      <div className="text-[10px] font-mono text-rose-300 bg-slate-950 px-2 py-0.5 rounded mt-1.5">
                        Matched: "{t.detectedPattern}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Mock Tool Execution Receipt */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                SAFE MOCK TOOL EXECUTION RECEIPT
              </span>
              <span className="text-[10px] font-mono text-slate-500">SANDBOX ISOLATED</span>
            </div>

            {toolExecution ? (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-bold">{toolExecution.toolName}</span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                    STATUS: {toolExecution.status}
                  </span>
                </div>
                <p className="text-xs text-slate-200">{toolExecution.message}</p>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded">
                  <div>Execution ID: <span className="text-slate-200">{toolExecution.executionId}</span></div>
                  <div>Simulated Result: {JSON.stringify(toolExecution.simulatedResult)}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <span>
                  {decision === 'REQUIRE_APPROVAL'
                    ? 'Tool execution withheld pending supervisor authorization in Approval Center.'
                    : 'Tool execution blocked by ActionGuard control plane. No real or simulated operations executed.'}
                </span>
              </div>
            )}
          </div>

          {/* Section 5: Immutable Audit Trace Timeline */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Immutable Trace Timeline ({traceId})</span>
            </div>
            <div className="space-y-3">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-slate-500 text-[10px] pt-0.5 w-16">{step.timestamp}</span>
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    step.status === 'success'
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                      : step.status === 'warning'
                      ? 'bg-amber-400 shadow-sm shadow-amber-500/50'
                      : step.status === 'error'
                      ? 'bg-rose-400 shadow-sm shadow-rose-500/50'
                      : 'bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <div className="font-mono font-bold text-slate-200 text-[11px]">{step.step}</div>
                    <div className="text-slate-400 text-[11px]">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            ActionGuard Control Plane • Strict Human-in-the-loop Governance
          </span>

          <div className="flex items-center gap-2">
            {decision === 'REQUIRE_APPROVAL' && approvalStatus === 'PENDING' && onApprove && onReject && (
              <>
                <button
                  id="btn-modal-reject"
                  onClick={() => {
                    onReject(actionId);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                >
                  Reject Action
                </button>
                <button
                  id="btn-modal-approve"
                  onClick={() => {
                    onApprove(actionId);
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                >
                  Authorize & Execute Mock Tool
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
