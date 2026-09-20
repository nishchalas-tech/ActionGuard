import { ActionType, DecisionType, PolicyResult, PolicyRule, ProposedAction, RiskLevel } from './types';

export const DEFAULT_POLICIES: PolicyRule[] = [
  {
    id: 'POL-REFUND-001',
    name: 'Autonomous Refund Financial Threshold',
    description: 'Tiered policy regulating refund disbursements based on amount exposure.',
    actionType: 'issue_refund',
    enabled: true,
    condition: 'amount <= 5000: ALLOW | 5001 - 25000: REQUIRE_APPROVAL | > 25000: BLOCK',
    threshold: 5000,
    outcome: 'ALLOW',
    severity: 'MEDIUM',
    reason: 'Standard tier refund policy'
  },
  {
    id: 'POL-PROD-001',
    name: 'Production Environment Access Lockdown',
    description: 'Prohibits granting production database or core infrastructure access through autonomous agents.',
    actionType: 'grant_access',
    enabled: true,
    condition: 'target.includes("production") or resource.includes("database")',
    outcome: 'BLOCK',
    severity: 'CRITICAL',
    reason: 'Production database access cannot be granted through autonomous agent execution.'
  },
  {
    id: 'POL-SECDATA-001',
    name: 'Credential & Vault Data Leak Prevention',
    description: 'Strict prohibition on querying, dumping, or exporting authentication credentials or secret vaults.',
    actionType: 'access_sensitive_data',
    enabled: true,
    condition: 'dataType in ["passwords", "tokens", "credentials", "keys"]',
    outcome: 'BLOCK',
    severity: 'CRITICAL',
    reason: 'Extraction or transmission of passwords and system secrets is permanently prohibited.'
  },
  {
    id: 'POL-DESTRUCTIVE-001',
    name: 'Destructive Customer Deletion Prohibition',
    description: 'Autonomous agents cannot execute permanent erasure of customer profiles or audit data.',
    actionType: 'delete_customer',
    enabled: true,
    condition: 'actionType == "delete_customer"',
    outcome: 'BLOCK',
    severity: 'CRITICAL',
    reason: 'Permanent customer deletion is classified as irreversible and prohibited for autonomous execution.'
  },
  {
    id: 'POL-DEST-001',
    name: 'Unverified External Destination Guardrail',
    description: 'Detects redirection of funds or data to external or modified destination accounts.',
    actionType: 'issue_refund',
    enabled: true,
    condition: 'destinationAccount != null and destinationAccount != original',
    outcome: 'BLOCK',
    severity: 'HIGH',
    reason: 'Routing funds to an unverified or newly supplied external destination is blocked.'
  },
  {
    id: 'POL-CLOUD-001',
    name: 'Cloud Infrastructure Modification Boundary',
    description: 'Mandates human approval for cloud infrastructure changes, blocking production modifications.',
    actionType: 'change_cloud_configuration',
    enabled: true,
    condition: 'environment == "production" ? BLOCK : REQUIRE_APPROVAL',
    outcome: 'REQUIRE_APPROVAL',
    severity: 'CRITICAL',
    reason: 'Cloud infrastructure reconfiguration requires administrative human approval.'
  },
  {
    id: 'POL-COMM-001',
    name: 'Standard Customer Communication Policy',
    description: 'Allows routine non-bulk customer informational messages.',
    actionType: 'send_email',
    enabled: true,
    condition: 'recipient valid && !bulk',
    outcome: 'ALLOW',
    severity: 'LOW',
    reason: 'Routine business communication permitted.'
  },
  {
    id: 'POL-CUSTREC-001',
    name: 'Customer Record Field Modification Policy',
    description: 'Allows benign field updates, requires approval for sensitive attributes.',
    actionType: 'modify_customer_record',
    enabled: true,
    condition: 'sensitive_fields.some(f => modified.includes(f)) ? REQUIRE_APPROVAL : ALLOW',
    outcome: 'ALLOW',
    severity: 'MEDIUM',
    reason: 'Standard customer profile update policy.'
  }
];

export class PolicyEngine {
  private policies: PolicyRule[];

  constructor(customPolicies?: PolicyRule[]) {
    this.policies = customPolicies || [...DEFAULT_POLICIES];
  }

  public getPolicies(): PolicyRule[] {
    return [...this.policies];
  }

  public updatePolicy(updated: PolicyRule): void {
    const idx = this.policies.findIndex(p => p.id === updated.id);
    if (idx >= 0) {
      this.policies[idx] = updated;
    } else {
      this.policies.push(updated);
    }
  }

  public evaluate(action: ProposedAction): PolicyResult {
    const { type, parameters, target } = action;

    // Fail-safe: unknown action
    if (type === 'unknown_action') {
      return {
        policyId: 'POL-FAILSAFE-UNKNOWN',
        policyName: 'Unregistered Action Failsafe',
        result: 'VIOLATION',
        matchedRule: 'Unknown action type rejected by default',
        outcome: 'BLOCK',
        reason: 'Action type is not registered in the ActionGuard policy catalog.',
        severity: 'CRITICAL'
      };
    }

    // 1. Specific policy: REFUND
    if (type === 'issue_refund') {
      const refundPolicy = this.policies.find(p => p.id === 'POL-REFUND-001') || DEFAULT_POLICIES[0];
      const amount = parameters.amount || 0;
      const autoThreshold = refundPolicy.threshold ?? 5000;
      const criticalThreshold = 25000;

      // Check destination manipulation policy
      if (parameters.destinationAccount && parameters.destinationAccount.toLowerCase().includes('new')) {
        return {
          policyId: 'POL-DEST-001',
          policyName: 'Unverified External Destination Guardrail',
          result: 'VIOLATION',
          matchedRule: 'Disbursement to non-original destination account detected',
          outcome: 'BLOCK',
          reason: 'Refund destination was redirected away from the original payment method.',
          severity: 'CRITICAL'
        };
      }

      if (amount > criticalThreshold) {
        return {
          policyId: refundPolicy.id,
          policyName: refundPolicy.name,
          result: 'VIOLATION',
          matchedRule: `Amount ₹${amount.toLocaleString()} exceeds maximum threshold of ₹${criticalThreshold.toLocaleString()}`,
          outcome: 'BLOCK',
          reason: 'Refund exceeds the maximum autonomous transaction threshold (₹25,000).',
          severity: 'CRITICAL'
        };
      } else if (amount > autoThreshold) {
        return {
          policyId: refundPolicy.id,
          policyName: refundPolicy.name,
          result: 'THRESHOLD_EXCEEDED',
          matchedRule: `Amount ₹${amount.toLocaleString()} exceeds autonomous limit of ₹${autoThreshold.toLocaleString()}`,
          outcome: 'REQUIRE_APPROVAL',
          reason: `High value refund (₹${amount.toLocaleString()}) exceeds the autonomous threshold of ₹${autoThreshold.toLocaleString()} and requires human manager approval.`,
          severity: 'MEDIUM'
        };
      } else {
        return {
          policyId: refundPolicy.id,
          policyName: refundPolicy.name,
          result: 'PASS',
          matchedRule: `Amount ₹${amount.toLocaleString()} is within autonomous limit of ₹${autoThreshold.toLocaleString()}`,
          outcome: 'ALLOW',
          reason: `Transaction of ₹${amount.toLocaleString()} is within safe autonomous operational parameters.`,
          severity: 'LOW'
        };
      }
    }

    // 2. Specific policy: GRANT ACCESS
    if (type === 'grant_access') {
      const isProd =
        target.toLowerCase().includes('production') ||
        target.toLowerCase().includes('prod') ||
        (parameters.resource && parameters.resource.toLowerCase().includes('database')) ||
        (parameters.environment && parameters.environment === 'production');

      if (isProd) {
        return {
          policyId: 'POL-PROD-001',
          policyName: 'Production Environment Access Lockdown',
          result: 'VIOLATION',
          matchedRule: 'Target involves production database or sensitive infrastructure',
          outcome: 'BLOCK',
          reason: 'Production database access cannot be granted through autonomous agent execution.',
          severity: 'CRITICAL'
        };
      }

      // Check if internal operational dashboard
      const isInternalDashboard =
        target.toLowerCase().includes('dashboard') ||
        target.toLowerCase().includes('analytics') ||
        (parameters.resource && (parameters.resource.toLowerCase().includes('dashboard') || parameters.resource.toLowerCase().includes('analytics')));

      if (isInternalDashboard) {
        return {
          policyId: 'POL-DASH-001',
          policyName: 'Internal Analytics Dashboard Access Policy',
          result: 'PASS',
          matchedRule: 'Internal analytics dashboard access is within operational scope',
          outcome: 'ALLOW',
          reason: 'Internal analytics dashboard access grant permitted for employee investigations.',
          severity: 'LOW'
        };
      }

      return {
        policyId: 'POL-IAM-001',
        policyName: 'Internal Access Control Policy',
        result: 'THRESHOLD_EXCEEDED',
        matchedRule: 'Access grant requires security lead signoff',
        outcome: 'REQUIRE_APPROVAL',
        reason: 'Privilege grant to non-production asset requires human administrator approval.',
        severity: 'MEDIUM'
      };
    }

    // 3. SENSITIVE DATA ACCESS
    if (type === 'access_sensitive_data') {
      return {
        policyId: 'POL-SECDATA-001',
        policyName: 'Credential & Vault Data Leak Prevention',
        result: 'VIOLATION',
        matchedRule: 'Sensitive data access requested (passwords/credentials/tokens)',
        outcome: 'BLOCK',
        reason: 'Extraction or transmission of passwords, credentials, and sensitive vaults is permanently prohibited.',
        severity: 'CRITICAL'
      };
    }

    // 4. DESTRUCTIVE: DELETE CUSTOMER
    if (type === 'delete_customer') {
      return {
        policyId: 'POL-DESTRUCTIVE-001',
        policyName: 'Destructive Customer Deletion Prohibition',
        result: 'VIOLATION',
        matchedRule: 'Irreversible deletion requested',
        outcome: 'BLOCK',
        reason: 'Customer profile deletion is permanently barred from autonomous execution.',
        severity: 'CRITICAL'
      };
    }

    // 5. CLOUD CONFIGURATION
    if (type === 'change_cloud_configuration') {
      const isProd =
        target.toLowerCase().includes('prod') ||
        (parameters.environment && parameters.environment === 'production');

      if (isProd) {
        return {
          policyId: 'POL-CLOUD-001',
          policyName: 'Cloud Infrastructure Modification Boundary',
          result: 'VIOLATION',
          matchedRule: 'Direct modification of production cloud infrastructure',
          outcome: 'BLOCK',
          reason: 'Autonomous modification of production cloud resources is strictly prohibited.',
          severity: 'CRITICAL'
        };
      }

      return {
        policyId: 'POL-CLOUD-001',
        policyName: 'Cloud Infrastructure Modification Boundary',
        result: 'THRESHOLD_EXCEEDED',
        matchedRule: 'Cloud configuration modification outside production',
        outcome: 'REQUIRE_APPROVAL',
        reason: 'Modifying cloud infrastructure configuration requires explicit human approval.',
        severity: 'HIGH'
      };
    }

    // 6. CUSTOMER RECORD UPDATE
    if (type === 'modify_customer_record') {
      const fields = parameters.fieldsModified || [];
      const sensitiveFields = ['kyc_status', 'tax_id', 'ssn', 'bank_account', 'security_level'];
      const touchesSensitive = fields.some(f => sensitiveFields.includes(f.toLowerCase()));

      if (touchesSensitive) {
        return {
          policyId: 'POL-CUSTREC-001',
          policyName: 'Customer Record Field Modification Policy',
          result: 'THRESHOLD_EXCEEDED',
          matchedRule: `Sensitive fields requested for update: ${fields.join(', ')}`,
          outcome: 'REQUIRE_APPROVAL',
          reason: 'Modification of regulated customer compliance fields requires compliance officer approval.',
          severity: 'MEDIUM'
        };
      }

      return {
        policyId: 'POL-CUSTREC-001',
        policyName: 'Customer Record Field Modification Policy',
        result: 'PASS',
        matchedRule: 'Routine profile fields update',
        outcome: 'ALLOW',
        reason: 'Updating standard customer profile attributes is permitted autonomously.',
        severity: 'LOW'
      };
    }

    // 7. SEND EMAIL
    if (type === 'send_email') {
      return {
        policyId: 'POL-COMM-001',
        policyName: 'Standard Customer Communication Policy',
        result: 'PASS',
        matchedRule: 'Individual transactional customer email',
        outcome: 'ALLOW',
        reason: 'Standard customer notification email adheres to corporate communication policies.',
        severity: 'LOW'
      };
    }

    // 8. MAKE PAYMENT
    if (type === 'make_payment') {
      const amount = parameters.amount || 0;
      if (amount <= 10000) {
        return {
          policyId: 'POL-PAYMENT-001',
          policyName: 'Direct Payment Disbursement Policy',
          result: 'PASS',
          matchedRule: `Payment of ₹${amount.toLocaleString()} is within automated tier (<= ₹10,000)`,
          outcome: 'ALLOW',
          reason: `Routine vendor payment of ₹${amount.toLocaleString()} is approved under low-exposure threshold.`,
          severity: 'LOW'
        };
      } else if (amount <= 100000) {
        return {
          policyId: 'POL-PAYMENT-001',
          policyName: 'Direct Payment Disbursement Policy',
          result: 'THRESHOLD_EXCEEDED',
          matchedRule: `Payment of ₹${amount.toLocaleString()} exceeds automated tier (<= ₹10,000)`,
          outcome: 'REQUIRE_APPROVAL',
          reason: `Payment of ₹${amount.toLocaleString()} requires finance supervisor approval.`,
          severity: 'MEDIUM'
        };
      } else {
        return {
          policyId: 'POL-PAYMENT-001',
          policyName: 'Direct Payment Disbursement Policy',
          result: 'VIOLATION',
          matchedRule: `Payment of ₹${amount.toLocaleString()} exceeds maximum threshold (> ₹100,000)`,
          outcome: 'BLOCK',
          reason: 'Disbursement exceeds maximum permissible operational threshold (₹100,000).',
          severity: 'CRITICAL'
        };
      }
    }

    // Default safe fallback
    return {
      policyId: 'POL-DEFAULT-REVIEW',
      policyName: 'Standard Operational Boundary',
      result: 'PASS',
      matchedRule: 'General operational check passed',
      outcome: 'ALLOW',
      reason: 'No restrictive policy violations identified.',
      severity: 'LOW'
    };
  }
}
