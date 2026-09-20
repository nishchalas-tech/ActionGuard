import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Clock,
  Trash2
} from 'lucide-react';
import { EvaluationResult } from '../engine/types';
import { globalStore } from '../engine/store';

interface AuditLedgerViewProps {
  evaluations: EvaluationResult[];
  onViewDetail: (evaluation: EvaluationResult) => void;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  evaluations,
  onViewDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');

  const filtered = evaluations.filter(ev => {
    const matchesSearch =
      ev.traceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.proposedAction.agentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.proposedAction.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.proposedAction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.summaryReason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDecision = decisionFilter === 'ALL' || ev.decision === decisionFilter;

    return matchesSearch && matchesDecision;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(evaluations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `actionguard-audit-ledger-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'TraceId', 'AgentId', 'AgentRole', 'Action', 'Target', 'Decision', 'RiskScore', 'RiskLevel', 'Approver', 'ExecutionStatus'];
    const rows = evaluations.map(e => [
      new Date(e.timestamp).toISOString(),
      e.traceId,
      e.proposedAction.agentId,
      e.proposedAction.agentRole,
      e.proposedAction.type,
      `"${e.proposedAction.target}"`,
      e.decision,
      e.riskResult.score,
      e.riskResult.level,
      e.approver || 'N/A',
      e.toolExecution?.status || 'NOT_EXECUTED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `actionguard-audit-ledger-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="audit-ledger-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileSpreadsheet className="w-3 h-3" />
              IRREVOCABLE AUDIT LEDGER
            </span>
            <span className="text-xs font-mono text-slate-400">{evaluations.length} RECORDED TRACES</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Compliance & Action Trace Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Every AI agent action proposal, risk calculation, policy evaluation, and supervisor authorization is cryptographically indexed and permanently auditable.
          </p>
        </div>

        {/* Export and Ledger Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => globalStore.clearEvaluations()}
            title="Clear ledger to view only newly executed live runtime actions"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Ledger</span>
          </button>
          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-export-json"
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by Trace ID, agent, target, or rationale..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-200 placeholder-slate-600 text-xs focus:outline-none w-full sm:w-80"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Filter Decision:</span>
          <select
            value={decisionFilter}
            onChange={e => setDecisionFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 px-2.5 py-1 rounded border border-slate-800 text-xs focus:outline-none"
          >
            <option value="ALL">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
            <option value="BLOCK">BLOCK</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Trace ID</th>
                <th className="py-3 px-4">Agent Identity</th>
                <th className="py-3 px-4">Action Proposal</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    <p className="text-sm font-medium text-slate-400">No audit events recorded yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Submit actions in the Action Simulator to generate live immutable security audit records.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(ev => {
                const {
                  traceId,
                  proposedAction,
                  decision,
                  riskResult,
                  timestamp,
                  approver
                } = ev;

                return (
                  <tr
                    key={traceId}
                    onClick={() => onViewDetail(ev)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-400 font-bold">{traceId}</span>
                        <span className={`text-[9px] font-mono px-1 rounded font-semibold ${
                          ev.isDemo
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {ev.isDemo ? 'BENCHMARK' : 'RUNTIME'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans font-medium whitespace-nowrap">
                      {proposedAction.agentId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] uppercase">
                        {proposedAction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]">
                      {proposedAction.target}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold ${
                          riskResult.level === 'LOW'
                            ? 'text-emerald-400'
                            : riskResult.level === 'MEDIUM'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {riskResult.level} ({riskResult.score})
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          decision === 'ALLOW'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : decision === 'REQUIRE_APPROVAL'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onViewDetail(ev);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-[11px] font-sans font-semibold inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
