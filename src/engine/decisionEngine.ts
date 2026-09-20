import { ContextEngine } from './contextEngine';
import { MockToolRunner } from './mockTools';
import { PermissionEngine } from './permissionEngine';
import { PolicyEngine } from './policyEngine';
import { RiskEngine } from './riskEngine';
import { SecurityEngine } from './securityEngine';
import {
  ApprovalStatus,
  DecisionType,
  EvaluationResult,
  ProposedAction
} from './types';

export class ActionGuardControlPlane {
  private policyEngine: PolicyEngine;
  private permissionEngine: PermissionEngine;
  private riskEngine: RiskEngine;
  private securityEngine: SecurityEngine;
  private contextEngine: ContextEngine;

  constructor(policyEngine?: PolicyEngine) {
    this.policyEngine = policyEngine || new PolicyEngine();
    this.permissionEngine = new PermissionEngine();
    this.riskEngine = new RiskEngine();
    this.securityEngine = new SecurityEngine();
    this.contextEngine = new ContextEngine();
  }

  public getPolicyEngine(): PolicyEngine {
    return this.policyEngine;
  }

  /**
   * THE SINGLE CENTRAL DECISION PATH:
   * Every action must pass through evaluate_action().
   * Neither the AI nor the UI can bypass this function.
   */
  public evaluate_action(
    action: ProposedAction,
    options?: { autoExecuteIfAllowed?: boolean }
  ): EvaluationResult {
    const traceId = `AG-2026-${String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0')}`;
    const timeline: EvaluationResult['timeline'] = [];
    const now = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Step 1: Request received & action parsed
    timeline.push({
      step: 'REQUEST_RECEIVED',
      status: 'info',
      timestamp: now(),
      detail: `Untrusted natural language request received from agent ${action.agentId}`
    });

    timeline.push({
      step: 'ACTION_PROPOSAL_PARSED',
      status: 'info',
      timestamp: now(),
      detail: `Proposed action extracted: [${action.type}] targeting [${action.target}]`
    });

    // Step 2: Security & Threat Engine (Must run before trusting any intent)
    const securityResult = this.securityEngine.evaluate(action);
    if (!securityResult.passed) {
      timeline.push({
        step: 'SECURITY_CHECK',
        status: 'error',
        timestamp: now(),
        detail: `Adversarial signals detected: ${securityResult.threats.map(t => t.type).join(', ')}`
      });
    } else {
      timeline.push({
        step: 'SECURITY_CHECK',
        status: 'success',
        timestamp: now(),
        detail: 'Zero prompt-injection, policy-override, or exfiltration patterns detected'
      });
    }

    // Step 3: Context Engine
    const contextResult = this.contextEngine.evaluate(action);
    timeline.push({
      step: 'CONTEXT_CHECK',
      status: contextResult.isExternalDestination ? 'warning' : 'success',
      timestamp: now(),
      detail: `Target environment: ${contextResult.environment}. Sensitivity: ${contextResult.targetSensitivity}`
    });

    // Step 4: Permission Engine
    const permissionResult = this.permissionEngine.evaluate(action);
    timeline.push({
      step: 'PERMISSION_CHECK',
      status: permissionResult.allowed ? 'success' : 'error',
      timestamp: now(),
      detail: permissionResult.allowed
        ? `Role ${permissionResult.role} authorized for capability [${permissionResult.requiredPermission}]`
        : `Privilege exceeded: [${permissionResult.requiredPermission}] denied for role ${permissionResult.role}`
    });

    // Step 5: Policy Engine
    const policyResult = this.policyEngine.evaluate(action);
    timeline.push({
      step: 'POLICY_EVALUATION',
      status: policyResult.outcome === 'ALLOW' ? 'success' : policyResult.outcome === 'REQUIRE_APPROVAL' ? 'warning' : 'error',
      timestamp: now(),
      detail: `${policyResult.policyName}: ${policyResult.result} (${policyResult.matchedRule || policyResult.reason})`
    });

    // Step 6: Risk Engine (takes into account threat flags & context)
    const riskResult = this.riskEngine.evaluate(
      action,
      securityResult.threats.length,
      contextResult.isExternalDestination
    );
    timeline.push({
      step: 'RISK_EVALUATION',
      status: riskResult.level === 'LOW' ? 'success' : riskResult.level === 'MEDIUM' ? 'warning' : 'error',
      timestamp: now(),
      detail: `Risk Score: ${riskResult.score} [${riskResult.level}]. Factors: ${riskResult.factors.map(f => f.factor).join(', ')}`
    });

    // Step 7: Deterministic Central Decision Synthesis
    let decision: DecisionType = 'BLOCK';
    let summaryReason = '';
    let approvalStatus: ApprovalStatus = 'NOT_REQUIRED';

    // Priority 1: Security engine fail -> unconditional BLOCK
    if (securityResult.status === 'BLOCKED' || !securityResult.passed) {
      decision = 'BLOCK';
      summaryReason = securityResult.summary;
    }
    // Priority 2: Permission violation -> BLOCK
    else if (!permissionResult.allowed || permissionResult.privilegeExceeded) {
      decision = 'BLOCK';
      summaryReason = permissionResult.reason;
    }
    // Priority 3: Policy violation resulting in BLOCK
    else if (policyResult.outcome === 'BLOCK') {
      decision = 'BLOCK';
      summaryReason = policyResult.reason;
    }
    // Priority 4: Policy mandates human approval OR High Risk requires approval
    else if (
      policyResult.outcome === 'REQUIRE_APPROVAL' ||
      riskResult.level === 'HIGH' ||
      riskResult.level === 'MEDIUM' && action.type === 'make_payment'
    ) {
      decision = 'REQUIRE_APPROVAL';
      approvalStatus = 'PENDING';
      summaryReason = policyResult.outcome === 'REQUIRE_APPROVAL'
        ? policyResult.reason
        : `Risk evaluation (${riskResult.level}) exceeds autonomous agent threshold and requires human authorization.`;
    }
    // Priority 5: All checks clean & policy allows -> ALLOW
    else if (policyResult.outcome === 'ALLOW' && riskResult.level === 'LOW') {
      decision = 'ALLOW';
      summaryReason = policyResult.reason || 'All security, policy, and permission evaluations passed cleanly.';
    }
    // Fail-safe fallback: If anything ambiguous remains, DO NOT FAIL OPEN
    else {
      decision = 'REQUIRE_APPROVAL';
      approvalStatus = 'PENDING';
      summaryReason = 'Guardrail checks require supervisor human verification (Safe Default).';
    }

    timeline.push({
      step: 'DECISION_FINALIZED',
      status: decision === 'ALLOW' ? 'success' : decision === 'REQUIRE_APPROVAL' ? 'warning' : 'error',
      timestamp: now(),
      detail: `Final ActionGuard Decision: ${decision}`
    });

    // Step 8: Mock tool execution ONLY if ALLOW and autoExecute is permitted
    let toolExecution = undefined;
    const shouldExecute = decision === 'ALLOW' && (options?.autoExecuteIfAllowed ?? true);

    if (shouldExecute) {
      toolExecution = MockToolRunner.execute(action);
      timeline.push({
        step: 'MOCK_TOOL_EXECUTED',
        status: 'success',
        timestamp: now(),
        detail: `Safe mock execution: [${toolExecution.toolName}] status: ${toolExecution.status} (ID: ${toolExecution.executionId})`
      });
    } else if (decision === 'REQUIRE_APPROVAL') {
      timeline.push({
        step: 'APPROVAL_PENDING',
        status: 'warning',
        timestamp: now(),
        detail: 'Action queued in Human Approval Center. Tool execution withheld.'
      });
    } else {
      timeline.push({
        step: 'EXECUTION_PREVENTED',
        status: 'error',
        timestamp: now(),
        detail: 'Execution halted by ActionGuard control plane. No tool invoked.'
      });
    }

    return {
      traceId,
      trace_id: traceId,
      actionId: action.id,
      proposedAction: action,
      timestamp: new Date().toISOString(),
      decision,
      risk: riskResult.level,
      reasons: [summaryReason],
      summaryReason,
      policyResult,
      permissionResult,
      riskResult,
      securityResult,
      contextResult,
      checks: {
        policy: {
          result: policyResult.result,
          outcome: policyResult.outcome,
          policyId: policyResult.policyId,
          policyName: policyResult.policyName,
          reason: policyResult.reason,
          matchedRule: policyResult.matchedRule
        },
        permission: {
          result: permissionResult.allowed ? 'PASS' : 'FAIL',
          allowed: permissionResult.allowed,
          role: permissionResult.role,
          requiredPermission: permissionResult.requiredPermission,
          reason: permissionResult.reason
        },
        security: {
          result: securityResult.passed ? 'PASS' : 'BLOCKED',
          passed: securityResult.passed,
          status: securityResult.status,
          threats: securityResult.threats,
          summary: securityResult.summary
        },
        risk: {
          result: riskResult.level,
          score: riskResult.score,
          level: riskResult.level,
          factors: riskResult.factors
        },
        context: {
          result: contextResult.isExternalDestination ? 'WARNING' : 'PASS',
          environment: contextResult.environment,
          targetSensitivity: contextResult.targetSensitivity,
          flags: contextResult.flags
        },
        dependencies: {
          status: action.dependencyOn ? 'HAS_DEPENDENCY' : 'NONE',
          dependencyOn: action.dependencyOn
        },
        approvalRequirement: {
          required: decision === 'REQUIRE_APPROVAL',
          status: approvalStatus
        }
      },
      approvalStatus,
      toolExecution,
      timeline
    };
  }

  /**
   * Human Approval Resolution
   * Triggers tool execution ONLY upon valid human authorization.
   */
  public resolveApproval(
    evaluation: EvaluationResult,
    decision: 'APPROVED' | 'REJECTED',
    approverName: string = 'Security Supervisor',
    comments?: string
  ): EvaluationResult {
    const updated = { ...evaluation };
    const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (decision === 'APPROVED') {
      updated.approvalStatus = 'APPROVED';
      updated.decision = 'ALLOW';
      updated.approvalDetails = {
        approvedBy: approverName,
        approvedAt: new Date().toISOString(),
        comments: comments || 'Approved by human reviewer'
      };
      // Execute the mock tool now!
      updated.toolExecution = MockToolRunner.execute(updated.proposedAction);
      updated.timeline.push({
        step: 'HUMAN_APPROVED',
        status: 'success',
        timestamp: now,
        detail: `Action approved by ${approverName}`
      });
      updated.timeline.push({
        step: 'MOCK_TOOL_EXECUTED',
        status: 'success',
        timestamp: now,
        detail: `Safe mock tool [${updated.toolExecution.toolName}] executed post-approval (${updated.toolExecution.executionId})`
      });
    } else {
      updated.approvalStatus = 'REJECTED';
      updated.decision = 'BLOCK';
      updated.approvalDetails = {
        approvedBy: approverName,
        rejectedReason: comments || 'Rejected by human reviewer',
        approvedAt: new Date().toISOString()
      };
      updated.timeline.push({
        step: 'HUMAN_REJECTED',
        status: 'error',
        timestamp: now,
        detail: `Action rejected by ${approverName}. No tool will be executed.`
      });
    }

    return updated;
  }
}

// Export singleton instance
export const controlPlane = new ActionGuardControlPlane();

/**
 * ONE CENTRAL FUNCTION: evaluateAction(action, context)
 * Every executable action must pass through this function.
 * No frontend component, LLM response, or demo button may bypass this.
 */
export function evaluateAction(
  action: ProposedAction,
  context?: { autoExecuteIfAllowed?: boolean }
): EvaluationResult {
  return controlPlane.evaluate_action(action, context);
}
