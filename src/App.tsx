import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavItem } from './components/Sidebar';
import { ActionDetailModal } from './components/ActionDetailModal';
import { FullDemoModal } from './components/FullDemoModal';

// Views
import { OverviewView } from './views/OverviewView';
import { ActionSimulatorView } from './views/ActionSimulatorView';
import { AgentSimulatorView } from './views/AgentSimulatorView';
import { ApprovalCenterView } from './views/ApprovalCenterView';
import { AttackLabView } from './views/AttackLabView';
import { WhatIfSimulatorView } from './views/WhatIfSimulatorView';
import { PolicyBuilderView } from './views/PolicyBuilderView';
import { AuditLedgerView } from './views/AuditLedgerView';
import { EnterpriseFrameworkView } from './views/EnterpriseFrameworkView';
import { BenchmarkTestView } from './views/BenchmarkTestView';

// Central State Store
import { globalStore } from './engine/store';
import { EvaluationResult, PolicyRule } from './engine/types';

export default function App() {
  const [currentView, setCurrentView] = useState<NavItem>('overview');
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>(globalStore.getEvaluations());
  const [policies, setPolicies] = useState<PolicyRule[]>(globalStore.getPolicies());
  const [stats, setStats] = useState(globalStore.getStats());

  // Modals
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Subscribe to global store updates
  useEffect(() => {
    const unsubscribe = globalStore.subscribe(() => {
      setEvaluations([...globalStore.getEvaluations()]);
      setPolicies([...globalStore.getPolicies()]);
      setStats({ ...globalStore.getStats() });
    });
    return () => unsubscribe();
  }, []);

  const handleApproveAction = (
    actionId: string,
    approver: string = 'Security Supervisor',
    comments?: string
  ) => {
    const updated = globalStore.approveAction(actionId, approver, comments);
    if (updated && selectedEvaluation && selectedEvaluation.actionId === actionId) {
      setSelectedEvaluation(updated);
    }
  };

  const handleRejectAction = (
    actionId: string,
    approver: string = 'Security Supervisor',
    comments?: string
  ) => {
    const updated = globalStore.rejectAction(actionId, approver, comments);
    if (updated && selectedEvaluation && selectedEvaluation.actionId === actionId) {
      setSelectedEvaluation(updated);
    }
  };

  const handleUpdatePolicy = (policy: PolicyRule) => {
    globalStore.updatePolicy(policy);
  };

  const pendingApprovals = evaluations.filter(
    e => e.decision === 'REQUIRE_APPROVAL' && e.approvalStatus === 'PENDING'
  );

  return (
    <div id="actionguard-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navbar */}
      <Navbar
        onRunFullDemo={() => setIsDemoModalOpen(true)}
        pendingCount={pendingApprovals.length}
        onNavigate={setCurrentView}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          pendingApprovalsCount={pendingApprovals.length}
        />

        {/* Content View Area */}
        <main
          id="main-viewport"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
        >
          <div className="max-w-6xl mx-auto pb-12">
            {currentView === 'overview' && (
              <OverviewView
                stats={stats}
                evaluations={evaluations}
                onViewDetail={setSelectedEvaluation}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'simulator' && (
              <ActionSimulatorView
                onViewDetail={setSelectedEvaluation}
                onApprove={handleApproveAction}
                onReject={handleRejectAction}
              />
            )}

            {currentView === 'agent_sim' && (
              <AgentSimulatorView
                onViewDetail={setSelectedEvaluation}
                onApprove={handleApproveAction}
              />
            )}

            {currentView === 'approvals' && (
              <ApprovalCenterView
                pendingApprovals={pendingApprovals}
                onApprove={handleApproveAction}
                onReject={handleRejectAction}
                onViewDetail={setSelectedEvaluation}
              />
            )}

            {currentView === 'attack_lab' && (
              <AttackLabView onViewDetail={setSelectedEvaluation} />
            )}

            {currentView === 'what_if' && (
              <WhatIfSimulatorView onViewDetail={setSelectedEvaluation} />
            )}

            {(currentView === 'policy_builder' || currentView === 'policies') && (
              <PolicyBuilderView
                policies={policies}
                onUpdatePolicy={handleUpdatePolicy}
              />
            )}

            {currentView === 'audit' && (
              <AuditLedgerView
                evaluations={evaluations}
                onViewDetail={setSelectedEvaluation}
              />
            )}

            {(currentView === 'use_cases' || currentView === 'architecture') && (
              <EnterpriseFrameworkView />
            )}

            {currentView === 'benchmarks' && <BenchmarkTestView />}
          </div>
        </main>
      </div>

      {/* Action Details Modal */}
      <ActionDetailModal
        evaluation={selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
      />

      {/* Full Demo Presidio Modal */}
      <FullDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onViewActionDetail={setSelectedEvaluation}
      />
    </div>
  );
}
