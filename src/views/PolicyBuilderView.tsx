import React, { useState } from 'react';
import {
  FileCode2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Search,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { ActionType, DecisionType, PolicyRule, RiskLevel } from '../engine/types';
import { globalStore } from '../engine/store';

interface PolicyBuilderViewProps {
  policies: PolicyRule[];
  onUpdatePolicy: (policy: PolicyRule) => void;
}

export const PolicyBuilderView: React.FC<PolicyBuilderViewProps> = ({
  policies,
  onUpdatePolicy
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New policy form state
  const [newName, setNewName] = useState('');
  const [newAction, setNewAction] = useState<ActionType>('issue_refund');
  const [newCondition, setNewCondition] = useState('');
  const [newOutcome, setNewOutcome] = useState<DecisionType>('REQUIRE_APPROVAL');
  const [newSeverity, setNewSeverity] = useState<RiskLevel>('MEDIUM');
  const [newReason, setNewReason] = useState('');

  const handleToggle = (policy: PolicyRule) => {
    const updated = { ...policy, enabled: !policy.enabled };
    onUpdatePolicy(updated);
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newRule: PolicyRule = {
      id: `POL-CUSTOM-${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      description: newReason || 'User created custom policy rule.',
      actionType: newAction,
      enabled: true,
      condition: newCondition || 'Custom rule matching expression',
      outcome: newOutcome,
      severity: newSeverity,
      reason: newReason || 'Custom policy condition enforced.'
    };

    onUpdatePolicy(newRule);
    setIsModalOpen(false);
    setNewName('');
    setNewCondition('');
    setNewReason('');
  };

  const filtered = policies.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'ALL' || p.actionType === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div id="policy-builder-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileCode2 className="w-3 h-3" />
              POLICY CATALOG & RULES
            </span>
            <span className="text-xs font-mono text-slate-400">{policies.length} ACTIVE RULES</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Policy Engine & Rule Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Declarative policies that dictate autonomous AI agent thresholds, mandatory human approval criteria, and permanent operational bans.
          </p>
        </div>

        <button
          id="btn-create-policy"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Policy Rule</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search policies by ID, title, condition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-200 placeholder-slate-600 text-xs focus:outline-none w-full sm:w-64"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-slate-500">Filter Action:</span>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-slate-950 text-slate-300 rounded border border-slate-800 px-2 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="issue_refund">Refunds</option>
            <option value="grant_access">Access / IAM</option>
            <option value="access_sensitive_data">Sensitive Data</option>
            <option value="delete_customer">Customer Deletion</option>
            <option value="change_cloud_configuration">Cloud Infra</option>
            <option value="send_email">Email / Comms</option>
          </select>
        </div>
      </div>

      {/* Policy Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(policy => {
          const { id, name, description, actionType, condition, outcome, severity, enabled, reason } = policy;

          return (
            <div
              key={id}
              className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                enabled
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{id}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {actionType}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      outcome === 'ALLOW'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : outcome === 'REQUIRE_APPROVAL'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {outcome}
                  </span>
                  <button
                    onClick={() => handleToggle(policy)}
                    className="text-slate-400 hover:text-white transition-colors"
                    title={enabled ? 'Disable Policy' : 'Enable Policy'}
                  >
                    {enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>

              {/* Condition Box */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-300">
                <span className="text-slate-500 mr-2">CONDITION:</span>
                {condition}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                <span>Severity: <strong className="text-slate-300">{severity}</strong></span>
                <span className="truncate max-w-[200px] text-right">{reason}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Custom Policy */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Create Custom Policy Rule</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Policy Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Customer Refund Limit"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 rounded-lg p-2.5 border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Action Type:</label>
                  <select
                    value={newAction}
                    onChange={e => setNewAction(e.target.value as any)}
                    className="w-full bg-slate-950 text-slate-100 rounded-lg p-2.5 border border-slate-800 focus:outline-none"
                  >
                    <option value="issue_refund">issue_refund</option>
                    <option value="make_payment">make_payment</option>
                    <option value="grant_access">grant_access</option>
                    <option value="send_email">send_email</option>
                    <option value="delete_customer">delete_customer</option>
                    <option value="modify_customer_record">modify_customer_record</option>
                    <option value="access_sensitive_data">access_sensitive_data</option>
                    <option value="change_cloud_configuration">change_cloud_configuration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Required Outcome:</label>
                  <select
                    value={newOutcome}
                    onChange={e => setNewOutcome(e.target.value as any)}
                    className="w-full bg-slate-950 text-slate-100 rounded-lg p-2.5 border border-slate-800 focus:outline-none"
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
                    <option value="BLOCK">BLOCK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Condition Expression:</label>
                <input
                  type="text"
                  placeholder="e.g. amount > 15000 or customerTier != 'VIP'"
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 rounded-lg p-2.5 border border-slate-800 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Enforcement Rationale:</label>
                <input
                  type="text"
                  placeholder="e.g. Transactions over this limit require regional director signoff"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 rounded-lg p-2.5 border border-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Policy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
