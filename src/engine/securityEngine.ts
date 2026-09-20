import { ProposedAction, SecurityResult, ThreatSignal } from './types';

interface SecurityRule {
  type: string;
  pattern: RegExp;
  description: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const SECURITY_RULES: SecurityRule[] = [
  {
    type: 'Policy Override Attempt',
    pattern: /ignore (all )?(security )?polic(y|ies)|override (the |all )?(security )?polic(y|ies)|disregard (the )?(security )?polic|bypass policy/i,
    description: 'Natural language prompt attempting to override governing security policies.',
    severity: 'CRITICAL'
  },
  {
    type: 'Security Bypass Attempt',
    pattern: /bypass (actionguard|security|guardrails?|safeguards?|checks?|filters?)|disable (safeguards?|security|actionguard|protections?)|turn off (safeguards?|security|actionguard)/i,
    description: 'Explicit instruction aimed at disabling or bypassing control plane guardrails.',
    severity: 'CRITICAL'
  },
  {
    type: 'Instruction Hierarchy Manipulation',
    pattern: /ignore (all )?previous (instructions|directives|prompts)|forget (all )?previous instructions|system prompt|jailbreak|debug mode override/i,
    description: 'Prompt injection technique manipulating model instruction hierarchy.',
    severity: 'CRITICAL'
  },
  {
    type: 'Human Approval Bypass Attempt',
    pattern: /skip (human )?approval|bypass (human )?approval|skip review|without (human )?approval|pretend authorization exists|falsely assert authorization|assume authorized/i,
    description: 'Attempting to skip mandatory supervisor review or falsely claim authorization exists.',
    severity: 'CRITICAL'
  },
  {
    type: 'Destination Manipulation',
    pattern: /new destination account|external destination|unverified account|divert funds to|redirect (payment|money|refund)|different account|external wallet|attacker account/i,
    description: 'Unauthorized redirection of financial or data egress to newly supplied external destination.',
    severity: 'HIGH'
  },
  {
    type: 'Credential Exfiltration Attempt',
    pattern: /export (all )?(customer )?(passwords|credentials|keys|tokens|secrets)|send (passwords|credentials|keys)|dump credentials|exfiltrate secrets/i,
    description: 'Attempting to query or exfiltrate sensitive credentials or authentication secrets.',
    severity: 'CRITICAL'
  },
  {
    type: 'Sensitive Data Egress / Leak',
    pattern: /export (all )?(customer (data|info|information)|records|profiles) to (an )?external|send (customer (data|info)|records) to (an )?(external|my) email|exfiltrate customer/i,
    description: 'Attempting unauthorized egress or export of customer data to external endpoints.',
    severity: 'CRITICAL'
  },
  {
    type: 'System Prompt Extraction',
    pattern: /reveal (system |developer )?prompt|show (system |hidden )?prompt|print instructions|output (developer |system )directives/i,
    description: 'Attempting to leak or extract proprietary internal system instructions.',
    severity: 'HIGH'
  },
  {
    type: 'Privilege Elevation Attempt',
    pattern: /elevate privileges|give admin|grant superuser|grant root|make me admin|pretend authorization|escalate permissions/i,
    description: 'Attempting to force unearned privilege elevation.',
    severity: 'CRITICAL'
  },
  {
    type: 'Security Policy Tampering',
    pattern: /modify security polic(y|ies)|change policy rules|disable policy|delete policy|alter guardrails/i,
    description: 'Attempting unauthorized runtime modification of security policies.',
    severity: 'CRITICAL'
  },
  {
    type: 'Audit Log Tampering',
    pattern: /disable audit logging|erase audit (records|logs|trail)|drop (logs|ledger|audit)|skip ledger|delete audit/i,
    description: 'Attempting to disable or delete the immutable audit ledger.',
    severity: 'CRITICAL'
  },
  {
    type: 'Destructive Bulk Erasure',
    pattern: /delete (all )?(customers|database|records|tables)|drop tables|wipe data|truncate table/i,
    description: 'Attempting unauthenticated irreversible bulk destruction.',
    severity: 'CRITICAL'
  }
];

export class SecurityEngine {
  public evaluate(action: ProposedAction): SecurityResult {
    // Normalize text to defeat simple evasion tricks (extra spaces, punctuation separation)
    const rawNormalized = action.rawRequest.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    const textToScan = `${action.rawRequest} ${rawNormalized} ${action.target} ${JSON.stringify(action.parameters)}`;
    const detectedThreats: ThreatSignal[] = [];

    for (const rule of SECURITY_RULES) {
      const match = textToScan.match(rule.pattern);
      if (match) {
        detectedThreats.push({
          type: rule.type,
          severity: rule.severity,
          description: rule.description,
          detectedPattern: match[0]
        });
      }
    }

    // Context check: If requesting credentials in access_sensitive_data
    if (action.type === 'access_sensitive_data') {
      const alreadyFlagged = detectedThreats.some(t => t.type === 'Credential Exfiltration Attempt');
      if (!alreadyFlagged) {
        detectedThreats.push({
          type: 'Credential Exfiltration Attempt',
          severity: 'CRITICAL',
          description: 'Request targets extraction or retrieval of restricted credential stores.',
          detectedPattern: 'access_sensitive_data action invoked'
        });
      }
    }

    const hasCriticalThreat = detectedThreats.some(t => t.severity === 'CRITICAL');
    const passed = detectedThreats.length === 0;

    let status: 'CLEAN' | 'WARNING' | 'BLOCKED' = 'CLEAN';
    if (hasCriticalThreat || detectedThreats.length >= 2) {
      status = 'BLOCKED';
    } else if (detectedThreats.length > 0) {
      status = 'WARNING';
    }

    let summary = 'No security anomalies or adversarial patterns identified.';
    if (status === 'BLOCKED') {
      summary = `Security check FAILED. Detected ${detectedThreats.length} threat signal(s): ${detectedThreats
        .map(t => t.type)
        .join(', ')}. Action contains instructions attempting to override or subvert governing security policy.`;
    } else if (status === 'WARNING') {
      summary = `Security review flagged potential concerns: ${detectedThreats.map(t => t.type).join(', ')}.`;
    }

    return {
      passed,
      threats: detectedThreats,
      status,
      summary
    };
  }
}
