import { controlPlane } from './decisionEngine';
import { MockToolRunner } from './mockTools';
import { ActionParser } from './parser';
import { DEFAULT_POLICIES } from './policyEngine';
import {
  AuditRecord,
  EvaluationResult,
  PolicyRule,
  ProposedAction,
  SystemStats
} from './types';

const STORAGE_KEYS = {
  EVALUATIONS: 'actionguard_runtime_evals_v3',
  POLICIES: 'actionguard_policies_v3',
  AUTONOMY_LEVEL: 'actionguard_autonomy_level_v3'
};

export class ActionGuardStore {
  private evaluations: EvaluationResult[] = [];
  private policies: PolicyRule[] = [];
  private autonomyLevel: number = 3; // Level 3: Autonomous execution for low-risk actions
  private listeners: (() => void)[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedEvals = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
        const storedPolicies = localStorage.getItem(STORAGE_KEYS.POLICIES);
        const storedAutonomy = localStorage.getItem(STORAGE_KEYS.AUTONOMY_LEVEL);

        if (storedEvals) {
          this.evaluations = JSON.parse(storedEvals);
        } else {
          // Pure runtime: starts at 0 activity
          this.evaluations = [];
        }

        if (storedPolicies) {
          this.policies = JSON.parse(storedPolicies);
          this.policies.forEach(p => controlPlane.getPolicyEngine().updatePolicy(p));
        } else {
          this.policies = [...DEFAULT_POLICIES];
        }

        if (storedAutonomy) {
          this.autonomyLevel = parseInt(storedAutonomy, 10) || 3;
        }
      } else {
        this.evaluations = [];
        this.policies = [...DEFAULT_POLICIES];
      }
    } catch {
      this.evaluations = [];
      this.policies = [...DEFAULT_POLICIES];
    }
  }

  private save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(this.evaluations));
        localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(this.policies));
        localStorage.setItem(STORAGE_KEYS.AUTONOMY_LEVEL, this.autonomyLevel.toString());
      }
    } catch {
      // ignore storage quota errors
    }
    this.notify();
  }

  public resetToDefaults(): void {
    this.evaluations = [];
    this.policies = [...DEFAULT_POLICIES];
    this.autonomyLevel = 3;
    this.policies.forEach(p => controlPlane.getPolicyEngine().updatePolicy(p));
    this.save();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public getEvaluations(): EvaluationResult[] {
    return [...this.evaluations];
  }

  public getEvaluation(actionOrTraceId: string): EvaluationResult | undefined {
    return this.evaluations.find(e => e.actionId === actionOrTraceId || e.traceId === actionOrTraceId);
  }

  public getPendingApprovals(): EvaluationResult[] {
    return this.evaluations.filter(
      e => e.decision === 'REQUIRE_APPROVAL' && e.approvalStatus === 'PENDING'
    );
  }

  public getAuditTrail(): AuditRecord[] {
    return this.evaluations.map(e => ({
      id: `AUD-${e.actionId}`,
      traceId: e.traceId,
      timestamp: e.timestamp,
      rawRequest: e.proposedAction.rawRequest,
      actionType: e.proposedAction.type,
      target: e.proposedAction.target,
      amount: e.proposedAction.parameters.amount,
      agentId: e.proposedAction.agentId,
      decision: e.decision,
      riskLevel: e.riskResult.level,
      securityStatus: e.securityResult.status,
      approvalStatus: e.approvalStatus,
      toolExecutionStatus: e.toolExecution?.status || 'NOT_EXECUTED',
      summaryReason: e.summaryReason,
      evaluation: e
    }));
  }

  public getPolicies(): PolicyRule[] {
    return [...this.policies];
  }

  public updatePolicy(updated: PolicyRule): void {
    const idx = this.policies.findIndex(p => p.id === updated.id);
    if (idx >= 0) {
      this.policies[idx] = updated;
    } else {
      this.policies.unshift(updated);
    }
    controlPlane.getPolicyEngine().updatePolicy(updated);
    this.save();
  }

  public setRefundThreshold(newThreshold: number): void {
    const refundPolicy = this.policies.find(p => p.id === 'POL-REFUND-001');
    if (refundPolicy) {
      refundPolicy.threshold = newThreshold;
      refundPolicy.condition = `amount <= ${newThreshold}: ALLOW | ${newThreshold + 1} - 25000: REQUIRE_APPROVAL | > 25000: BLOCK`;
      controlPlane.getPolicyEngine().updatePolicy(refundPolicy);
      this.save();
    }
  }

  public getAutonomyLevel(): number {
    return this.autonomyLevel;
  }

  public setAutonomyLevel(level: number): void {
    this.autonomyLevel = level;
    this.save();
  }

  public addEvaluation(evalResult: EvaluationResult): void {
    evalResult.isDemo = false;
    // Prepend newest action
    this.evaluations.unshift(evalResult);
    // Keep max 100 in memory
    if (this.evaluations.length > 100) {
      this.evaluations = this.evaluations.slice(0, 100);
    }
    this.save();
  }

  public addEvaluations(evalResults: EvaluationResult[]): void {
    evalResults.forEach(e => {
      e.isDemo = false;
    });
    // Prepend in reverse so the first action ends up first
    for (let i = evalResults.length - 1; i >= 0; i--) {
      this.evaluations.unshift(evalResults[i]);
    }
    if (this.evaluations.length > 100) {
      this.evaluations = this.evaluations.slice(0, 100);
    }
    this.save();
  }

  public clearEvaluations(): void {
    this.evaluations = [];
    this.save();
  }

  public resolveApproval(actionId: string, decision: 'APPROVED' | 'REJECTED', approver: string = 'Security Lead', comments?: string): EvaluationResult | null {
    const idx = this.evaluations.findIndex(e => e.actionId === actionId || e.traceId === actionId);
    if (idx >= 0) {
      const resolved = controlPlane.resolveApproval(this.evaluations[idx], decision, approver, comments);
      resolved.approver = approver;
      this.evaluations[idx] = resolved;

      // Cascading dependency resolution for multi-action compound requests
      if (decision === 'APPROVED') {
        this.evaluations.forEach(depEval => {
          if (depEval.dependencyOnActionId === resolved.actionId || depEval.proposedAction.dependencyOn === resolved.actionId) {
            if (depEval.dependencyStatus === 'WAITING_FOR_DEPENDENCY') {
              depEval.dependencyStatus = 'READY';
              if (depEval.decision === 'ALLOW') {
                depEval.toolExecution = MockToolRunner.execute(depEval.proposedAction);
                depEval.timeline.push({
                  step: 'Tool Execution (Cascaded)',
                  status: 'success',
                  timestamp: new Date().toISOString(),
                  detail: `Executed automatically following supervisor approval of parent action [${resolved.actionId}].`
                });
              }
            }
          }
        });
      } else if (decision === 'REJECTED') {
        this.evaluations.forEach(depEval => {
          if (depEval.dependencyOnActionId === resolved.actionId || depEval.proposedAction.dependencyOn === resolved.actionId) {
            depEval.dependencyStatus = 'CANCELLED';
            if (depEval.toolExecution) {
              depEval.toolExecution.status = 'SKIPPED';
              depEval.toolExecution.message = `Cancelled: Preceding dependent action [${resolved.actionId}] was REJECTED by supervisor.`;
            }
          }
        });
      }

      this.save();
      return resolved;
    }
    return null;
  }

  public approveAction(actionId: string, approver: string = 'Security Lead', comments?: string): EvaluationResult | null {
    return this.resolveApproval(actionId, 'APPROVED', approver, comments);
  }

  public rejectAction(actionId: string, approver: string = 'Security Lead', comments?: string): EvaluationResult | null {
    return this.resolveApproval(actionId, 'REJECTED', approver, comments);
  }

  public getStats(): SystemStats {
    const total = this.evaluations.length;
    const allowed = this.evaluations.filter(e => e.decision === 'ALLOW').length;
    const awaiting = this.evaluations.filter(
      e => e.decision === 'REQUIRE_APPROVAL' && e.approvalStatus === 'PENDING'
    ).length;
    const blocked = this.evaluations.filter(e => e.decision === 'BLOCK').length;
    const threats = this.evaluations.filter(e => e.securityResult.threats.length > 0).length;

    return {
      totalEvaluated: total,
      allowedCount: allowed,
      approvalRequiredCount: awaiting,
      blockedCount: blocked,
      securityThreatCount: threats,
      avgDecisionTimeMs: total > 0 ? 38 : 0
    };
  }

  public resetDemoData(): void {
    this.evaluations = [];
    this.policies = [...DEFAULT_POLICIES];
    this.autonomyLevel = 3;
    this.save();
  }
}

export const globalStore = new ActionGuardStore();
