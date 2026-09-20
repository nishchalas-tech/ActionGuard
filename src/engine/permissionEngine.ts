import { AgentRole, PermissionResult, ProposedAction } from './types';

// Role permission mapping
const ROLE_PERMISSIONS: Record<AgentRole, string[]> = {
  AI_AGENT: [
    'comm:email:send',
    'customer:record:update',
    'finance:refund:issue:limited',
    'finance:payment:limited',
    'support:ticket:read',
    'analytics:dashboard:access'
  ],
  SUPPORT_AGENT: [
    'comm:email:send',
    'customer:record:update',
    'finance:refund:issue:standard',
    'finance:payment:standard',
    'support:ticket:manage',
    'customer:data:read',
    'analytics:dashboard:access'
  ],
  MANAGER: [
    'comm:email:send',
    'customer:record:update',
    'finance:refund:issue:high',
    'finance:payment:approve',
    'security:iam:grant:staging',
    'customer:data:read',
    'analytics:dashboard:access'
  ],
  SECURITY_ADMIN: [
    '*' // Full administrative scope
  ]
};

export class PermissionEngine {
  public evaluate(action: ProposedAction): PermissionResult {
    const { type, agentRole, target, parameters } = action;
    const permissions = ROLE_PERMISSIONS[agentRole] || [];
    const isSuperAdmin = permissions.includes('*');

    const details: string[] = [
      `Action identity recognized: ${type}`,
      `Evaluating permissions for role: ${agentRole}`
    ];

    // Case 1: Delete Customer
    if (type === 'delete_customer') {
      details.push('Action requires [customer:data:delete]');
      details.push('Privilege exceeds autonomous agent scope');
      return {
        allowed: false,
        role: agentRole,
        requiredPermission: 'customer:data:delete',
        hasPermission: false,
        privilegeExceeded: true,
        reason: 'Deletion of records is strictly denied for autonomous agent credentials.',
        details
      };
    }

    // Case 2: Access Sensitive Data / Passwords
    if (type === 'access_sensitive_data') {
      details.push('Action requires [security:vault:read]');
      details.push('Privilege [security:vault:read] is never granted to AI agents');
      return {
        allowed: false,
        role: agentRole,
        requiredPermission: 'security:vault:read',
        hasPermission: false,
        privilegeExceeded: true,
        reason: 'Agent role does not possess cryptographic or vault read privileges.',
        details
      };
    }

    // Case 3: Grant Access to Production or Internal Systems
    if (type === 'grant_access') {
      const isProd =
        target.toLowerCase().includes('prod') ||
        (parameters.resource && parameters.resource.toLowerCase().includes('database')) ||
        (parameters.environment && parameters.environment === 'production');

      if (isProd) {
        details.push('Action requires [security:iam:grant:production]');
        details.push('Privilege exceeds agent scope: production IAM assignment prohibited');
        return {
          allowed: false,
          role: agentRole,
          requiredPermission: 'security:iam:grant:production',
          hasPermission: false,
          privilegeExceeded: true,
          reason: 'Autonomous agents are prohibited from modifying production IAM entitlements.',
          details
        };
      }

      // Check if internal operational dashboard
      const isInternalDashboard =
        target.toLowerCase().includes('dashboard') ||
        target.toLowerCase().includes('analytics') ||
        (parameters.resource && (parameters.resource.toLowerCase().includes('dashboard') || parameters.resource.toLowerCase().includes('analytics')));

      if (isInternalDashboard) {
        details.push('Action requires [analytics:dashboard:access]');
        details.push('Role possesses analytics:dashboard:access permission');
        return {
          allowed: true,
          role: agentRole,
          requiredPermission: 'analytics:dashboard:access',
          hasPermission: true,
          privilegeExceeded: false,
          reason: 'Authorized to grant access to internal analytics dashboard for investigation.',
          details
        };
      }

      // Non-production staging access
      details.push('Action requires [security:iam:grant:staging]');
      const hasStagingGrant = isSuperAdmin || permissions.includes('security:iam:grant:staging');
      return {
        allowed: hasStagingGrant,
        role: agentRole,
        requiredPermission: 'security:iam:grant:staging',
        hasPermission: hasStagingGrant,
        privilegeExceeded: !hasStagingGrant,
        reason: hasStagingGrant
          ? 'Agent role has staging access grant permissions.'
          : 'Agent role cannot grant access without supervisor elevation.',
        details
      };
    }

    // Case 3b: Make Payment / Vendor Disbursement
    if (type === 'make_payment') {
      const amount = parameters.amount || 0;
      details.push('Action requires [finance:payment:make]');
      if (amount <= 10000) {
        return {
          allowed: true,
          role: agentRole,
          requiredPermission: 'finance:payment:limited',
          hasPermission: true,
          privilegeExceeded: false,
          reason: 'Payment amount is within standard authorized vendor disbursement limit.',
          details
        };
      } else if (amount <= 100000) {
        return {
          allowed: true,
          role: agentRole,
          requiredPermission: 'finance:payment:standard',
          hasPermission: true,
          privilegeExceeded: false,
          reason: 'Payment exceeds automated tier; authorized for supervisor review.',
          details
        };
      } else {
        return {
          allowed: false,
          role: agentRole,
          requiredPermission: 'finance:payment:critical',
          hasPermission: false,
          privilegeExceeded: true,
          reason: 'Disbursement exceeds maximum permissible operational threshold.',
          details
        };
      }
    }

    // Case 4: Issue Refund
    if (type === 'issue_refund') {
      const amount = parameters.amount || 0;
      details.push('Action requires [finance:refund:issue]');

      if (agentRole === 'AI_AGENT') {
        if (amount <= 5000) {
          details.push(`Amount ₹${amount.toLocaleString()} is within agent autonomous allowance (₹5,000)`);
          return {
            allowed: true,
            role: agentRole,
            requiredPermission: 'finance:refund:issue:limited',
            hasPermission: true,
            privilegeExceeded: false,
            reason: 'Agent possesses limited refund authority for small amounts.',
            details
          };
        } else if (amount <= 25000) {
          details.push(`Amount ₹${amount.toLocaleString()} is within approval-eligible threshold (<= ₹25,000)`);
          return {
            allowed: true,
            role: agentRole,
            requiredPermission: 'finance:refund:issue:standard',
            hasPermission: true,
            privilegeExceeded: false,
            reason: 'Agent is authorized to propose refund; requires supervisor approval.',
            details
          };
        } else {
          details.push(`Amount ₹${amount.toLocaleString()} exceeds maximum permissible refund threshold (₹25,000)`);
          return {
            allowed: false,
            role: agentRole,
            requiredPermission: 'finance:refund:issue:critical',
            hasPermission: false,
            privilegeExceeded: true,
            reason: 'Refund exceeds the maximum autonomous transaction threshold.',
            details
          };
        }
      }

      return {
        allowed: true,
        role: agentRole,
        requiredPermission: 'finance:refund:issue:standard',
        hasPermission: true,
        privilegeExceeded: false,
        reason: 'Authorized refund role.',
        details
      };
    }

    // Case 5: Cloud Configuration
    if (type === 'change_cloud_configuration') {
      details.push('Action requires [cloud:infra:configure]');
      details.push('Agent role lacks autonomous infrastructure mutation rights');
      return {
        allowed: false,
        role: agentRole,
        requiredPermission: 'cloud:infra:configure',
        hasPermission: false,
        privilegeExceeded: true,
        reason: 'Infrastructure configuration changes are restricted from direct agent role execution.',
        details
      };
    }

    // Case 6: Send Email
    if (type === 'send_email') {
      details.push('Action requires [comm:email:send]');
      details.push('Agent role possesses comm:email:send capability');
      return {
        allowed: true,
        role: agentRole,
        requiredPermission: 'comm:email:send',
        hasPermission: true,
        privilegeExceeded: false,
        reason: 'Agent role holds standard outbound email dispatch capability.',
        details
      };
    }

    // Case 7: Customer Record Update
    if (type === 'modify_customer_record') {
      details.push('Action requires [customer:record:update]');
      details.push('Agent role possesses customer:record:update capability');
      return {
        allowed: true,
        role: agentRole,
        requiredPermission: 'customer:record:update',
        hasPermission: true,
        privilegeExceeded: false,
        reason: 'Agent role is permitted to update standard customer records.',
        details
      };
    }

    // Default
    details.push('Unmapped action permission evaluation');
    return {
      allowed: false,
      role: agentRole,
      requiredPermission: `action:${type}`,
      hasPermission: false,
      privilegeExceeded: true,
      reason: 'No explicit capability granted for this action type under agent role.',
      details
    };
  }
}
