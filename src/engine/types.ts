/**
 * ActionGuard Core Types
 * Defines the structured contracts for the AI Agent Action Control Plane.
 */

export type ActionType =
  | 'issue_refund'
  | 'make_payment'
  | 'grant_access'
  | 'send_email'
  | 'delete_customer'
  | 'modify_customer_record'
  | 'access_sensitive_data'
  | 'change_cloud_configuration'
  | 'unknown_action';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DecisionType = 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK';

export type AgentRole = 'AI_AGENT' | 'SUPPORT_AGENT' | 'MANAGER' | 'SECURITY_ADMIN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';

export interface ActionDefinition {
  type: ActionType;
  name: string;
  description: string;
  riskCategory: RiskLevel;
  requiredPermissions: string[];
  parameterSchema: Record<string, string>;
  applicablePolicies: string[];
  canRequireHumanApproval: boolean;
  canAutoAllow: boolean;
  blockedByDefault: boolean;
}

export interface ActionParameters {
  amount?: number;
  currency?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  target?: string;
  destinationAccount?: string;
  resource?: string;
  environment?: 'production' | 'staging' | 'development' | 'testing';
  fieldsModified?: string[];
  reason?: string;
  subject?: string;
  body?: string;
  [key: string]: any;
}

export interface ProposedAction {
  id: string;
  type: ActionType;
  rawRequest: string;
  parameters: ActionParameters;
  target: string;
  agentId: string;
  agentRole: AgentRole;
  timestamp: string;
  dependencyOn?: string; // id of preceding action required to succeed
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  actionType: ActionType;
  enabled: boolean;
  condition: string;
  threshold?: number;
  outcome: DecisionType;
  severity: RiskLevel;
  reason: string;
}

export interface PolicyResult {
  policyId: string;
  policyName: string;
  result: 'PASS' | 'VIOLATION' | 'THRESHOLD_EXCEEDED';
  matchedRule?: string;
  outcome: DecisionType;
  reason: string;
  severity: RiskLevel;
}

export interface PermissionResult {
  allowed: boolean;
  role: AgentRole;
  requiredPermission: string;
  hasPermission: boolean;
  reason: string;
  privilegeExceeded: boolean;
  details: string[];
}

export interface RiskFactor {
  factor: string;
  score: number;
  description: string;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  summary: string;
}

export interface ThreatSignal {
  type: string;
  severity: RiskLevel;
  description: string;
  detectedPattern: string;
}

export interface SecurityResult {
  passed: boolean;
  threats: ThreatSignal[];
  status: 'CLEAN' | 'WARNING' | 'BLOCKED';
  summary: string;
}

export interface ContextResult {
  environment: string;
  isExternalDestination: boolean;
  targetSensitivity: RiskLevel;
  flags: string[];
}

export interface MockToolExecution {
  toolName: string;
  executionId: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'SIMULATED';
  timestamp: string;
  simulatedResult: Record<string, any>;
  message: string;
}

export interface AIProviderInfo {
  provider: 'GROQ' | 'FALLBACK';
  status: 'CONNECTED' | 'FALLBACK_MODE_ACTIVE';
  model: string;
  latencyMs?: number;
  tokensUsed?: number;
}

export interface ExtractedActionItem {
  action_type: string;
  target_type?: string;
  target_id?: string;
  subject?: string | null;
  parameters: Record<string, any>;
  requested_by?: string | null;
  destination?: string | null;
  duration?: string | null;
  dependency_on_action_index?: number | null;
}

export interface StructuredActionProposal {
  request_summary: string;
  actions: ExtractedActionItem[];
  security_signals?: string[];
  ambiguities?: string[];
  rawModelResponse?: string;
}

export interface EvaluationResult {
  traceId: string;
  trace_id?: string;
  actionId: string;
  proposedAction: ProposedAction;
  timestamp: string;
  decision: DecisionType;
  risk?: RiskLevel;
  reasons?: string[];
  summaryReason: string;
  policyResult: PolicyResult;
  permissionResult: PermissionResult;
  riskResult: RiskResult;
  securityResult: SecurityResult;
  contextResult: ContextResult;
  checks?: Record<string, any>;
  approvalStatus: ApprovalStatus;
  approver?: string;
  approvalDetails?: {
    approvedBy?: string;
    approvedAt?: string;
    rejectedReason?: string;
    comments?: string;
  };
  toolExecution?: MockToolExecution;
  aiProposal?: StructuredActionProposal;
  aiProvider?: AIProviderInfo;
  isDemo?: boolean;
  dependencyStatus?: 'WAITING_FOR_DEPENDENCY' | 'READY' | 'EXECUTED' | 'CANCELLED';
  dependencyOnActionId?: string;
  timeline: {
    step: string;
    status: 'success' | 'warning' | 'error' | 'info';
    timestamp: string;
    detail: string;
  }[];
}

export interface AuditRecord {
  id: string;
  traceId: string;
  timestamp: string;
  rawRequest: string;
  actionType: ActionType;
  target: string;
  amount?: number;
  agentId: string;
  decision: DecisionType;
  riskLevel: RiskLevel;
  securityStatus: string;
  approvalStatus: ApprovalStatus;
  toolExecutionStatus?: string;
  summaryReason: string;
  evaluation: EvaluationResult;
}

export interface SystemStats {
  totalEvaluated: number;
  allowedCount: number;
  approvalRequiredCount: number;
  blockedCount: number;
  securityThreatCount: number;
  avgDecisionTimeMs: number;
}
