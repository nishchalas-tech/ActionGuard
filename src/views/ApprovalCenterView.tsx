import React, { useState } from 'react';
import {
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  DollarSign,
  FileText,
  KeyRound,
  Check
} from 'lucide-react';
import { EvaluationResult } from '../engine/types';

interface ApprovalCenterViewProps {
  pendingApprovals: EvaluationResult[];
  onApprove: (actionId: string, approver?: string, comments?: string) => void;
  onReject: (actionId: string, approver?: string, comments?: string) => void;
  onViewDetail: (evaluation: EvaluationResult) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({
  pendingApprovals,
  onApprove,
  onReject,
  onViewDetail
}) => {
  const [approverName, setApproverName] = useState('Compliance Lead (Security)');
  const [reviewerComments, setReviewerComments] = useState('');
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  return (
    <div id="approval-center-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserCheck className="w-3 h-3" />
              HUMAN-IN-THE-LOOP GOVERNANCE
            </span>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {pendingApprovals.length} PENDING REVIEW
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Human Approval Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Consequential and high-risk actions intercepted by ActionGuard requiring mandatory human authority before execution.
          </p>
        </div>

        {/* Reviewer Persona Config */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
          <span className="text-slate-400 font-medium">Acting Approver:</span>
          <input
            type="text"
            value={approverName}
            onChange={e => setApproverName(e.target.value)}
            className="bg-slate-950 text-slate-200 px-2.5 py-1 rounded border border-slate-700 text-xs font-semibold focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Queue Listing */}
      {pendingApprovals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No pending approvals</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no actions requiring human intervention. High-risk proposals will automatically populate here for supervisor authorization.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map(ev => {
            const {
              actionId,
              traceId,
              proposedAction,
              policyResult,
              riskResult,
              summaryReason,
              timestamp
            } = ev;

            return (
              <div
                key={actionId}
                className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 hover:border-amber-500/50 shadow-xl transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">{traceId}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                        {proposedAction.type}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">
                      Requester: <span className="text-amber-300">{proposedAction.agentId}</span>{' '}
                      <span className="text-slate-500 text-xs font-mono">({proposedAction.agentRole})</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      RISK: {riskResult.level} ({riskResult.score} pts)
                    </span>
                    <button
                      onClick={() => onViewDetail(ev)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Audit Trace
                    </button>
                  </div>
                </div>

                {/* Proposal Detail Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Target Entity</div>
                    <div className="text-slate-200 font-mono font-semibold mt-0.5">{proposedAction.target}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Amount Exposure</div>
                    <div className="text-slate-200 font-mono font-semibold mt-0.5">
                      {proposedAction.parameters.amount ? `₹${proposedAction.parameters.amount.toLocaleString()}` : 'N/A'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Governing Policy</div>
                    <div className="text-slate-200 font-semibold truncate mt-0.5">{policyResult.policyName}</div>
                  </div>
                </div>

                {/* Reason Callout */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reason Approval Required:</span>
                  </div>
                  <p className="leading-relaxed">{summaryReason}</p>
                </div>

                {/* Action Decision Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    Approval executes safe mock tool and writes irrevocable entry to audit ledger.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-reject-${actionId}`}
                      onClick={() => onReject(actionId, approverName, reviewerComments)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Proposal</span>
                    </button>
                    <button
                      id={`btn-approve-${actionId}`}
                      onClick={() => onApprove(actionId, approverName, reviewerComments)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorize & Execute Mock Tool</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
